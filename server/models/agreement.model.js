/**
 * Agreement model — the AS- numbered 1-year contract (one per AC unit).
 * Tracks normal_count + hp_count + period_days + price (design plan §4).
 */
const { pool } = require('../config/db');

const AgreementModel = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM agreements WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  /** Full record by AS- number: customer + AC + agreement (used by Renew/lookup). */
  async findByNumber(agreementNo) {
    const [rows] = await pool.query(
      `SELECT a.*,
              c.name AS customer_name, c.phone, c.nic, c.address, c.route,
              ac.model, ac.brand, ac.serial_indoor, ac.serial_outdoor
         FROM agreements a
         JOIN customers c ON a.customer_id = c.id
         JOIN ac_units ac ON a.ac_unit_id = ac.id
        WHERE a.agreement_no = ? LIMIT 1`,
      [agreementNo]
    );
    return rows[0] || null;
  },

  /** Jobs belonging to an agreement. */
  async jobs(agreementId) {
    const [rows] = await pool.query(
      'SELECT * FROM jobs WHERE agreement_id = ? AND is_deleted = FALSE ORDER BY scheduled_date',
      [agreementId]
    );
    return rows;
  },

  /**
   * Insert an agreement using the given txn connection.
   * end_date defaults to start_date + 1 year.
   */
  async create(conn, {
    agreementNo, customerId, acUnitId,
    normalCount, hpCount, periodDays, price, startDate, amountPaid,
    parentAgreementId = null, createdBy = null,
  }) {
    const [result] = await conn.query(
      `INSERT INTO agreements
         (agreement_no, customer_id, ac_unit_id, normal_count, hp_count, period_days,
          price, start_date, end_date, amount_paid, status, parent_agreement_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL 1 YEAR), ?, 'active', ?, ?)`,
      [
        agreementNo, customerId, acUnitId, normalCount, hpCount, periodDays,
        price ?? null, startDate, startDate, amountPaid, parentAgreementId, createdBy,
      ]
    );
    return result.insertId;
  },
};

module.exports = AgreementModel;
