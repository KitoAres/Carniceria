const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT c.*, 
        COALESCE((
          SELECT SUM(v.total) - COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.venta_id = v.id),0)
          FROM ventas v
          WHERE v.cliente_id = c.id AND v.estado != 'pagado'
        ), 0) AS deuda_total
      FROM clientes c
    `;
    const params = [];
    if (q) { sql += ' WHERE c.nombre LIKE ?'; params.push(`%${q}%`); }
    sql += ' ORDER BY c.nombre ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  const { nombre, telefono, observacion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const [r] = await db.query(
      'INSERT INTO clientes (nombre, telefono, observacion) VALUES (?,?,?)',
      [nombre, telefono || null, observacion || null]
    );
    res.json({ ok: true, id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  const { nombre, telefono, observacion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    await db.query(
      'UPDATE clientes SET nombre=?, telefono=?, observacion=? WHERE id=?',
      [nombre, telefono || null, observacion || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/clientes/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM clientes WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
