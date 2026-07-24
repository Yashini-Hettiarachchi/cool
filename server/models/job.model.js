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

  // ---- Technician (Phase 4) ----

  /** Today's jobs assigned to a technician, in route order. */
  async myTodayJobs(technicianId) {
    const [rows] = await pool.query(
      `${JOB_JOIN}
        WHERE j.is_deleted = FALSE
          AND j.technician_id = ?
          AND j.scheduled_date = CURDATE()
        ORDER BY c.route, j.id`,
      [technicianId]
    );
    return rows;
  },

  /** All (non-deleted) visits under an AS- number — for technician AS- search. */
  async listByAgreementNo(agreementNo) {
    const [rows] = await pool.query(
      `${JOB_JOIN} WHERE j.is_deleted = FALSE AND a.agreement_no = ? ORDER BY j.scheduled_date, j.id`,
      [agreementNo]
    );
    return rows;
  },

  /** Owner check — does this job belong to the given technician? */
  async isOwnedBy(id, technicianId) {
    const [[row]] = await pool.query('SELECT technician_id FROM jobs WHERE id = ? LIMIT 1', [id]);
    return !!row && row.technician_id === technicianId;
  },

  /**
   * Technician status transition.
   *   in_progress → just flips status.
   *   completed   → records service_type_used, stamps completed_at, and leaves
   *                 admin_confirmed = FALSE so it lands in the approval queue.
   */
  async updateStatus(id, status, serviceTypeUsed) {
    if (status === 'completed') {
      await pool.query(
        `UPDATE jobs
            SET status = 'completed', service_type_used = ?,
                completed_at = NOW(), admin_confirmed = FALSE
          WHERE id = ?`,
        [serviceTypeUsed, id]
      );
    } else {
      await pool.query('UPDATE jobs SET status = ? WHERE id = ?', [status, id]);
    }
    return this.detail(id);
  },

  async countPhotos(jobId) {
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM job_photos WHERE job_id = ?', [jobId]);
    return n;
  },

  async addPhoto(jobId, photoPath, uploadedBy) {
    const [result] = await pool.query(
      'INSERT INTO job_photos (job_id, photo_path, uploaded_by) VALUES (?, ?, ?)',
      [jobId, photoPath, uploadedBy]
    );
    return { id: result.insertId, job_id: jobId, photo_path: photoPath };
  },

  async listPhotos(jobId) {
    const [rows] = await pool.query(
      'SELECT id, job_id, photo_path, uploaded_at FROM job_photos WHERE job_id = ? ORDER BY id',
      [jobId]
    );
    return rows;
  },

  /** Single photo row (for authenticated file streaming). */
  async getPhoto(jobId, photoId) {
    const [[row]] = await pool.query(
      'SELECT id, job_id, photo_path FROM job_photos WHERE id = ? AND job_id = ? LIMIT 1',
      [photoId, jobId]
    );
    return row || null;
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

  /**
   * Upcoming active visits (today onward) for the Assignments board —
   * scheduled or postponed, not deleted. Includes technician (may be NULL).
   */
  async listToAssign() {
    const [rows] = await pool.query(
      `${JOB_JOIN}
        WHERE j.is_deleted = FALSE
          AND j.status IN ('scheduled', 'postponed')
          AND j.scheduled_date >= CURDATE()
        ORDER BY (j.technician_id IS NOT NULL), j.scheduled_date, j.id`
    );
    return rows;
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
