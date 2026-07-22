/**
 * AC unit model — one or more per customer.
 * Fields: model, brand, indoor serial, outdoor serial, install notes.
 */
const { pool } = require('../config/db');

const AcUnitModel = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM ac_units WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async listByCustomer(customerId) {
    const [rows] = await pool.query(
      'SELECT * FROM ac_units WHERE customer_id = ? ORDER BY id',
      [customerId]
    );
    return rows;
  },

  /** Create an AC unit using the given db handle (pool or txn connection). */
  async create(db, customerId, { model, brand, serial_indoor, serial_outdoor, install_notes }) {
    const [result] = await db.query(
      `INSERT INTO ac_units (customer_id, model, brand, serial_indoor, serial_outdoor, install_notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, model || null, brand || null, serial_indoor || null, serial_outdoor || null, install_notes || null]
    );
    return result.insertId;
  },
};

module.exports = AcUnitModel;
