/**
 * Seed the first Admin user so the very first login is possible.
 *
 * Usage: npm run seed:admin   (from server/)
 *
 * Idempotent: if a user with the seed phone already exists, it is left alone.
 * Credentials come from env (SEED_ADMIN_*), never hardcoded.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function main() {
  const name = process.env.SEED_ADMIN_NAME || 'Administrator';
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const phone = process.env.SEED_ADMIN_PHONE || '0770000000';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [username]
  );

  if (existing.length > 0) {
    console.log(`Admin with username "${username}" already exists (id=${existing[0].id}). Nothing to do.`);
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, username, phone, role, password_hash, active) VALUES (?, ?, ?, ?, ?, TRUE)',
    [name, username, phone, 'admin', hash]
  );

  console.log(`Seeded admin user id=${result.insertId}`);
  console.log(`  username: ${username}`);
  console.log(`  password: ${password}  (change after first login)`);
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
