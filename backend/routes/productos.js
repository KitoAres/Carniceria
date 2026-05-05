const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/productos
router.get('/', async (req, res) => {
  try {
    const { todos } = req.query;
    let sql = 'SELECT * FROM productos';
    if (!todos) sql += ' WHERE activo = 1';
    sql += ' ORDER BY nombre ASC';
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
  const { nombre, precio_kilo, activo } = req.body;
  try {
    await db.query(
      'UPDATE productos SET nombre=?, precio_kilo=?, activo=? WHERE id=?',
      [nombre, precio_kilo, activo !== undefined ? activo : 1, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
