const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      INSERT INTO usuarios (usuario, password, nombre)
      VALUES ('admin', '123', 'Administrador')
      ON CONFLICT (usuario) DO NOTHING;
    `);

    console.log("✅ DB lista");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
