/**
 * MySQL connection pool (mysql2, promise API).
 *
 * A pool is created lazily and shared across the app. The pool itself does not
 * open a connection until the first query runs, so the server can boot even if
 * MySQL is not yet reachable — login/queries simply fail until the DB is up.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'ac_service_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci', // required for Sinhala text in `route`
  dateStrings: true, // return DATE/DATETIME as strings, avoid tz surprises
});

/** Quick connectivity check used by /api/health. */
async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { pool, ping };
