/**
 * Customer model — customers plus their linked AC units and agreements.
 * Search keys: NIC and phone (design plan §8 — surface every linked AC/agreement).
 */
const { pool } = require('../config/db');

const CustomerModel = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  /** Existing-customer check used before creating (NIC or phone match). */
  async findByNicOrPhone(nic, phone) {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE nic = ? OR phone = ? LIMIT 1',
      [nic, phone]
    );
    return rows[0] || null;
  },

  /**
   * Universal search by NIC, phone, or AS- number.
   * Returns matching customers (deduped). AS- resolves via the agreement.
   */
  async search(term) {
    const like = `%${term}%`;
    const [rows] = await pool.query(
      `SELECT DISTINCT c.*
         FROM customers c
         LEFT JOIN agreements a ON a.customer_id = c.id
        WHERE c.nic LIKE ? OR c.phone LIKE ? OR c.name LIKE ? OR a.agreement_no LIKE ?
        ORDER BY c.created_at DESC
        LIMIT 50`,
      [like, like, like, like]
    );
    return rows;
  },

  /** Full profile: customer + every AC unit + every agreement (with AC info). */
  async profile(id) {
    const customer = await this.findById(id);
    if (!customer) return null;

    const [acUnits] = await pool.query(
      'SELECT * FROM ac_units WHERE customer_id = ? ORDER BY id',
      [id]
    );
    const [agreements] = await pool.query(
      `SELECT a.*, ac.model, ac.brand, ac.serial_indoor, ac.serial_outdoor
         FROM agreements a
         JOIN ac_units ac ON a.ac_unit_id = ac.id
        WHERE a.customer_id = ?
        ORDER BY a.created_at DESC`,
      [id]
    );

    const years = Math.max(
      0,
      new Date().getFullYear() - new Date(customer.created_at).getFullYear()
    );

    return { customer: { ...customer, years_as_customer: years }, acUnits, agreements };
  },

  /** Create a customer using the given db handle (pool or txn connection). */
  async create(db, { name, phone, nic, address, route }) {
    const [result] = await db.query(
      'INSERT INTO customers (name, phone, nic, address, route) VALUES (?, ?, ?, ?, ?)',
      [name, phone, nic, address || null, route || null]
    );
    return result.insertId;
  },
};

module.exports = CustomerModel;
