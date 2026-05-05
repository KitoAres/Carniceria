const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/ventas  — con filtros opcionales
router.get('/', async (req, res) => {
  try {
    const { cliente_id, estado, hoy } = req.query;
    let sql = `
      SELECT v.*, c.nombre AS cliente_nombre
      FROM ventas v
      JOIN clientes c ON c.id = v.cliente_id
    `;
    const params = [];
    const where = [];
    if (cliente_id) { where.push('v.cliente_id = ?'); params.push(cliente_id); }
    if (estado)     { where.push('v.estado = ?');     params.push(estado); }
    if (hoy)        { where.push('DATE(v.fecha) = CURDATE()'); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY v.fecha DESC, v.hora DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ventas/:id  — venta completa con detalle y pagos
router.get('/:id', async (req, res) => {
  try {
    const [ventas] = await db.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
       FROM ventas v JOIN clientes c ON c.id = v.cliente_id
       WHERE v.id = ?`, [req.params.id]
    );
    if (!ventas.length) return res.status(404).json({ error: 'No encontrado' });
    const [detalle] = await db.query('SELECT * FROM venta_detalle WHERE venta_id = ?', [req.params.id]);
    const [pagos]   = await db.query('SELECT * FROM pagos WHERE venta_id = ? ORDER BY fecha ASC', [req.params.id]);
    const totalPagado = pagos.reduce((s, p) => s + parseFloat(p.monto), 0);
    res.json({ ...ventas[0], detalle, pagos, total_pagado: totalPagado, saldo: parseFloat(ventas[0].total) - totalPagado });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ventas  — crear venta con detalle
router.post('/', async (req, res) => {
  const { cliente_id, fecha, hora, total, observacion, detalle } = req.body;
  if (!cliente_id || !detalle || !detalle.length)
    return res.status(400).json({ error: 'Datos incompletos' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO ventas (cliente_id, fecha, hora, total, estado, observacion) VALUES (?,?,?,?,?,?)',
      [cliente_id, fecha, hora, total, 'pendiente', observacion || null]
    );
    const ventaId = r.insertId;
    for (const item of detalle) {
      await conn.query(
        'INSERT INTO venta_detalle (venta_id, producto, kilos, precio_kilo, subtotal) VALUES (?,?,?,?,?)',
        [ventaId, item.producto, item.kilos, item.precio_kilo, item.subtotal]
      );
    }
    await conn.commit();
    res.json({ ok: true, id: ventaId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// POST /api/ventas/:id/pago  — registrar pago (total o parcial)
router.post('/:id/pago', async (req, res) => {
  const { monto, observacion } = req.body;
  if (!monto || parseFloat(monto) <= 0)
    return res.status(400).json({ error: 'Monto inválido' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Insertar pago
    await conn.query(
      'INSERT INTO pagos (venta_id, monto, observacion) VALUES (?,?,?)',
      [req.params.id, monto, observacion || null]
    );
    // Recalcular estado
    const [[venta]] = await conn.query('SELECT total FROM ventas WHERE id=?', [req.params.id]);
    const [[{ pagado }]] = await conn.query('SELECT COALESCE(SUM(monto),0) AS pagado FROM pagos WHERE venta_id=?', [req.params.id]);
    const total = parseFloat(venta.total);
    const p     = parseFloat(pagado);
    let estado  = p >= total ? 'pagado' : p > 0 ? 'parcial' : 'pendiente';
    await conn.query('UPDATE ventas SET estado=? WHERE id=?', [estado, req.params.id]);
    await conn.commit();
    res.json({ ok: true, estado });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// DELETE /api/ventas/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ventas WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
