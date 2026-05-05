const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password)
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const user = rows[0];
    // Soporte para contraseña plana "123" en primer uso y bcrypt después
    let valid = false;
    if (user.password === password) {
      valid = true;
    } else {
      try { valid = await bcrypt.compare(password, user.password); } catch(e) {}
    }
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
    req.session.userId = user.id;
    req.session.userName = user.nombre || user.usuario;
    res.json({ ok: true, nombre: req.session.userName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session.userId) return res.json({ ok: true, nombre: req.session.userName });
  res.status(401).json({ ok: false });
});

module.exports = router;
