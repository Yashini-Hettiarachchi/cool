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

  /** Every (non-deleted) visit assigned to a technician — open jobs first, then done. */
  async myJobs(technicianId) {
    const [rows] = await pool.query(
      `${JOB_JOIN}
        WHERE j.is_deleted = FALSE
          AND j.technician_id = ?
        ORDER BY (j.status IN ('completed', 'cancelled')) ASC, j.scheduled_date ASC, j.id`,
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

  /**
   * Completed visits for the approvals screen. `confirmed=false` → pending queue;
   * `confirmed=true` → already-approved history. Includes photo_count.
   */
  async listCompletions(confirmed = false) {
    const [rows] = await pool.query(
      `SELECT j.*, a.agreement_no,
              c.id AS customer_id, c.name AS customer_name, c.phone, c.route,
              ac.brand, ac.model, u.name AS technician_name,
              (SELECT COUNT(*) FROM job_photos p WHERE p.job_id = j.id) AS photo_count
         FROM jobs j
         JOIN agreements a ON j.agreement_id = a.id
         JOIN customers c ON a.customer_id = c.id
         JOIN ac_units ac ON a.ac_unit_id = ac.id
         LEFT JOIN users u ON j.technician_id = u.id
        WHERE j.is_deleted = FALSE AND j.status = 'completed' AND j.admin_confirmed = ?
        ORDER BY j.completed_at DESC, j.id DESC`,
      [confirmed ? 1 : 0]
    );
    return rows;
  },

  /** Admin/office confirms a completed job (finalizes it out of the queue). */
  /**
   * Approve a completed visit.
   *
   * The UPDATE is guarded on `admin_confirmed = FALSE` so a repeated approval
   * (double-click, retried request) can't transition the same job twice.
   * `justConfirmed` reports whether THIS call did the transition — that's what
   * gates the completion SMS, so an approved customer is never texted again.
   */
  async confirm(id) {
    const [res] = await pool.query(
      'UPDATE jobs SET admin_confirmed = TRUE WHERE id = ? AND admin_confirmed = FALSE',
      [id]
    );
    return { job: await this.detail(id), justConfirmed: res.affectedRows === 1 };
  },

  /**
   * Visits due on a given date that still deserve a day-before reminder —
   * the reminder cron's work list.
   *
   * 'postponed' is included because a postponed job carries its NEW date in
   * scheduled_date; the customer still needs telling. 'completed' and
   * 'cancelled' are excluded — there is nothing left to remind them about.
   */
  async listForReminder(date) {
    const [rows] = await pool.query(
      `SELECT j.id, j.scheduled_date, j.status,
              a.agreement_no,
              c.id AS customer_id, c.name AS customer_name, c.phone
         FROM jobs j
         JOIN agreements a ON j.agreement_id = a.id
         JOIN customers c ON a.customer_id = c.id
        WHERE j.is_deleted = FALSE
          AND j.scheduled_date = ?
          AND j.status IN ('scheduled', 'postponed')
        ORDER BY j.id`,
      [date]
    );
    return rows;
  },

  /**
   * Everything the printable job card needs in one read: the job, its agreement
   * commercials, the customer, the AC unit, the technician, and where this visit
   * sits in the agreement's series (visit 3 of 4).
   */
  async cardData(id) {
    const [[row]] = await pool.query(
      `SELECT j.id, j.scheduled_date, j.status, j.service_type_used, j.comments,
              j.completed_at, j.admin_confirmed, j.postponed_from, j.postpone_days,
              j.postpone_reason, j.cancel_reason, j.notes,
              a.id AS agreement_id, a.agreement_no, a.normal_count, a.hp_count,
              a.period_days, a.price, a.start_date, a.end_date, a.amount_paid,
              a.status AS agreement_status,
              c.id AS customer_id, c.name AS customer_name, c.phone, c.nic,
              c.address, c.route,
              ac.brand, ac.model, ac.serial_indoor, ac.serial_outdoor, ac.install_notes,
              u.name AS technician_name, u.phone AS technician_phone,
              (SELECT COUNT(*) FROM job_photos p WHERE p.job_id = j.id) AS photo_count,
              (SELECT COUNT(*) FROM jobs sib
                 WHERE sib.agreement_id = j.agreement_id AND sib.is_deleted = FALSE) AS visit_total,
              (SELECT COUNT(*) FROM jobs sib
                 WHERE sib.agreement_id = j.agreement_id AND sib.is_deleted = FALSE
                   AND (sib.scheduled_date < j.scheduled_date
                        OR (sib.scheduled_date = j.scheduled_date AND sib.id <= j.id))) AS visit_no
         FROM jobs j
         JOIN agreements a ON j.agreement_id = a.id
         JOIN customers c ON a.customer_id = c.id
         JOIN ac_units ac ON a.ac_unit_id = ac.id
         LEFT JOIN users u ON j.technician_id = u.id
        WHERE j.id = ? LIMIT 1`,
      [id]
    );
    return row || null;
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
