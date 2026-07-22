/**
 * Pricing model — default price per service type (normal | hp).
 * Powers the Admin-only "Add Price" screen; pre-fills agreement price in Phase 2.
 */
const { pool } = require('../config/db');

const PricingModel = {
  /** All pricing rows. */
  async all() {
    const [rows] = await pool.query(
      'SELECT id, service_type, price, updated_at FROM pricing ORDER BY service_type'
    );
    return rows;
  },

  /** Get the price row for a single service type. */
  async getByType(serviceType) {
    const [rows] = await pool.query(
      'SELECT id, service_type, price, updated_at FROM pricing WHERE service_type = ? LIMIT 1',
      [serviceType]
    );
    return rows[0] || null;
  },

  /**
   * Set (insert or update) the price for a service type.
   * Relies on the UNIQUE constraint on service_type.
   */
  async upsert(serviceType, price) {
    await pool.query(
      `INSERT INTO pricing (service_type, price) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = NOW()`,
      [serviceType, price]
    );
    return this.getByType(serviceType);
  },
};

module.exports = PricingModel;
