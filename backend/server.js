require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'carniceria-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 } // 8 horas
}));

// ── Archivos estáticos ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth middleware para API ─────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'No autenticado' });
}

// ── Rutas API ────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/clientes',  requireAuth, require('./routes/clientes'));
app.use('/api/productos', requireAuth, require('./routes/productos'));
app.use('/api/ventas',    requireAuth, require('./routes/ventas'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard'));

// ── SPA fallback ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Arranque ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Carnicería Control de Deudas corriendo en puerto ${PORT}`);
});
