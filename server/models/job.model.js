/**
 * Job model — scheduling, assignment, and lifecycle transitions.
 *
 * Two distinct "removal" concepts (design plan §7):
 *   - cancel   : status='cancelled' + reason (customer-driven)  -> Job Cancellations view
 *   - softDelete: is_deleted=TRUE (mistake correction)           -> Deleted Jobs view
 * Nothing is ever hard-deleted.
 */
const { pool } = require('../config/db');

// Columns joined for calendar/detail views.
const JOB_JOIN = `
  SELECT j.*, a.agreement_no, a.normal_count, a.hp_count,
         c.id AS customer_id, c.name AS customer_name, c.phone, c.address, c.route,
         ac.brand, ac.model, ac.serial_indoor, ac.serial_outdoor,
         u.name AS technician_name
    FROM jobs j
    JOIN agreements a ON j.agreement_id = a.id
    JOIN customers c ON a.customer_id = c.id
    JOIN ac_units ac ON a.ac_unit_id = ac.id
    LEFT JOIN users u ON j.technician_id = u.id`;

const JobModel = {
  /** Jobs within a month (YYYY-MM), excluding soft-deleted — for the calendar. */
  async listByMonth(month) {
    const [rows] = await pool.query(
      `${JOB_JOIN}
        WHERE j.is_deleted = FALSE
          AND DATE_FORMAT(j.scheduled_date, '%Y-%m') = ?
        ORDER BY j.scheduled_date, j.id`,
      [month]
    );
    return rows;
  },

  /** Jobs on a specific day. */
  async listByDate(date) {
    const [rows] = await pool.query(
      `${JOB_JOIN} WHERE j.is_deleted = FALSE AND j.scheduled_date = ? ORDER BY j.id`,
      [date]
    );
    return rows;
  },

  /** Single job with full detail + photo count. */
  async detail(id) {
    const [rows] = await pool.query(`${JOB_JOIN} WHERE j.id = ? LIMIT 1`, [id]);
    const job = rows[0];
    if (!job) return null;
    const [[{ photo_count }]] = await pool.query(
      'SELECT COUNT(*) AS photo_count FROM job_photos WHERE job_id = ?',
      [id]
    );
    return { ...job, photo_count };
  },

  async assign(id, technicianId) {
    await pool.query('UPDATE jobs SET technician_id = ? WHERE id = ?', [technicianId, id]);
    return this.detail(id);
  },

  /** Postpone: shift scheduled_date by N days, record origin + reason. */
  async postpone(id, days, reason) {
    await pool.query(
      `UPDATE jobs
          SET postponed_from = scheduled_date,
              scheduled_date = DATE_ADD(scheduled_date, INTERVAL ? DAY),
              postpone_days = ?,
              postpone_reason = ?,
              status = 'postponed'
        WHERE id = ?`,
      [days, days, reason || null, id]
    );
    return this.detail(id);
  },

  async cancel(id, reason) {
    await pool.query(
      "UPDATE jobs SET status = 'cancelled', cancel_reason = ? WHERE id = ?",
      [reason || null, id]
    );
    return this.detail(id);
  },

  async softDelete(id) {
    await pool.query('UPDATE jobs SET is_deleted = TRUE WHERE id = ?', [id]);
    return this.detail(id);
  },

  async addComment(id, comments) {
    await pool.query('UPDATE jobs SET comments = ? WHERE id = ?', [comments || null, id]);
    return this.detail(id);
  },

  /** Deleted Jobs view — soft-deleted (mistakes). */
  async listDeleted() {
    const [rows] = await pool.query(`${JOB_JOIN} WHERE j.is_deleted = TRUE ORDER BY j.scheduled_date DESC`);
    return rows;
  },

  /** Job Cancellations view — cancelled but not deleted (distinct from above). */
  async listCancelled() {
    const [rows] = await pool.query(
      `${JOB_JOIN} WHERE j.status = 'cancelled' AND j.is_deleted = FALSE ORDER BY j.scheduled_date DESC`
    );
    return rows;
  },

  /** Active technicians for the assignment dropdown. */
  async listTechnicians() {
    const [rows] = await pool.query(
      "SELECT id, name, phone FROM users WHERE role = 'technician' AND active = TRUE ORDER BY name"
    );
    return rows;
  },

  /** Dashboard overview counts. */
  async overview() {
    const [[c]] = await pool.query('SELECT COUNT(*) n FROM customers');
    const [[a]] = await pool.query("SELECT COUNT(*) n FROM agreements WHERE status = 'active'");
    const [[u]] = await pool.query(
      "SELECT COUNT(*) n FROM jobs WHERE status = 'scheduled' AND is_deleted = FALSE AND scheduled_date >= CURDATE()"
    );
    const [[comp]] = await pool.query(
      "SELECT COUNT(*) n FROM jobs WHERE status = 'completed' AND admin_confirmed = TRUE AND DATE_FORMAT(completed_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')"
    );
    const [[pend]] = await pool.query(
      "SELECT COUNT(*) n FROM jobs WHERE status = 'completed' AND admin_confirmed = FALSE AND is_deleted = FALSE"
    );
    return {
      customers: c.n,
      activeAgreements: a.n,
      upcoming: u.n,
      completedThisMonth: comp.n,
      pendingApprovals: pend.n,
    };
  },

  /** Next scheduled visits from today onward. */
  async upcoming(limit = 6) {
    const [rows] = await pool.query(
      `${JOB_JOIN}
        WHERE j.is_deleted = FALSE AND j.status = 'scheduled' AND j.scheduled_date >= CURDATE()
        ORDER BY j.scheduled_date, j.id
        LIMIT ?`,
      [Number(limit)]
    );
    return rows;
  },
};

module.exports = JobModel;
