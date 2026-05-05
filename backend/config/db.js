const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Adaptador para que tu código viejo tipo MySQL siga funcionando:
// db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario])
// se convierte internamente a PostgreSQL: $1
module.exports = {
  query: async (sql, params = []) => {
    let index = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++index}`);

    const result = await pool.query(pgSql, params);

    // Simula el formato de mysql2: const [rows] = await db.query(...)
    return [result.rows, result];
  }
};
