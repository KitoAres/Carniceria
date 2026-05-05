const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const [[{ total_clientes }]] = await db.query('SELECT COUNT(*) AS total_clientes FROM clientes');

    const [[{ deudas_pendientes }]] = await db.query(
      "SELECT COUNT(*) AS deudas_pendientes FROM ventas WHERE estado != 'pagado'"
    );

    const [[{ monto_pendiente }]] = await db.query(
      `SELECT COALESCE(SUM(
        v.total - COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.venta_id=v.id),0)
      ),0) AS monto_pendiente
      FROM ventas v WHERE v.estado != 'pagado'`
    );

    const [[{ ventas_hoy }]] = await db.query(
      "SELECT COUNT(*) AS ventas_hoy FROM ventas WHERE DATE(fecha) = CURDATE()"
    );

    const [top_deudores] = await db.query(
      `SELECT c.id, c.nombre,
        COALESCE(SUM(
          v.total - COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.venta_id=v.id),0)
        ),0) AS deuda
       FROM clientes c
       LEFT JOIN ventas v ON v.cliente_id=c.id AND v.estado != 'pagado'
       GROUP BY c.id, c.nombre
       HAVING deuda > 0
       ORDER BY deuda DESC
       LIMIT 5`
    );

    res.json({ total_clientes, deudas_pendientes, monto_pendiente, ventas_hoy, top_deudores });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
