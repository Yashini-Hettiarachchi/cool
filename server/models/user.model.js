/**
 * User model — data access for the `users` table.
 * Roles: admin | system_user | technician.
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const PUBLIC_FIELDS = 'id, name, username, phone, role, active, created_at';

const UserModel = {
  /** Find a user by username (includes password_hash — for login only). */
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0] || null;
  },

  /** Find a user by phone (contact lookup / duplicate check). */
  async findByPhone(phone) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE phone = ? LIMIT 1',
      [phone]
    );
    return rows[0] || null;
  },

  /** Find a user by id (public fields only). */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /** List users, optionally filtered by role. */
  async list({ role } = {}) {
    if (role) {
      const [rows] = await pool.query(
        `SELECT ${PUBLIC_FIELDS} FROM users WHERE role = ? ORDER BY created_at DESC`,
        [role]
      );
      return rows;
    }
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_FIELDS} FROM users ORDER BY created_at DESC`
    );
    return rows;
  },

  /** Create a user with a hashed password. Returns the public record. */
  async create({ name, username, phone, role, password }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, username, phone, role, password_hash, active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [name, username, phone, role, hash]
    );
    return this.findById(result.insertId);
  },

  /**
   * Update a user. `password` is optional — only re-hashed if provided.
   * Only whitelisted fields can change.
   */
  async update(id, { name, username, phone, role, active, password }) {
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (username !== undefined) { fields.push('username = ?'); values.push(username); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (active !== undefined) { fields.push('active = ?'); values.push(!!active); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push('password_hash = ?');
      values.push(hash);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  /** Soft-delete: deactivate rather than hard-delete (preserves job/report links). */
  async deactivate(id) {
    await pool.query('UPDATE users SET active = FALSE WHERE id = ?', [id]);
    return this.findById(id);
  },

  /** Verify a plaintext password against a user's stored hash. */
  verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = UserModel;
