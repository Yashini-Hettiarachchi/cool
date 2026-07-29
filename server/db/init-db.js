/**
 * Initialise the database by running schema.sql.
 *
 * Usage: npm run db:init   (from server/)
 *
 * Connects WITHOUT selecting a database (schema.sql creates it), enabling
 * multipleStatements so the whole file runs in one shot. Safe to re-run —
 * schema.sql uses CREATE ... IF NOT EXISTS.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true,
  });

  console.log('Running schema.sql ...');
  await conn.query(sql);
  await conn.end();
  console.log('Database initialised (10 tables ready).');
}

main().catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
