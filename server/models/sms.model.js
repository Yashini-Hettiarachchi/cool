/**
 * SMS model — editable templates + the send history.
 *
 * Templates are stored as overrides only: a type with no row simply uses the
 * default shipped in services/smsService.js, so a fresh install (or one that
 * hasn't re-run schema.sql) still sends correct messages.
 */
const { pool } = require('../config/db');

const SmsModel = {
  /** Saved overrides, keyed by template_type. */
  async templateOverrides() {
    const [rows] = await pool.query(
      'SELECT t.template_type, t.body, t.updated_at, u.name AS updated_by_name FROM sms_templates t LEFT JOIN users u ON t.updated_by = u.id'
    );
    return rows;
  },

  /** Insert-or-update one template body. */
  async saveTemplate(type, body, userId) {
    await pool.query(
      `INSERT INTO sms_templates (template_type, body, updated_by) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE body = VALUES(body), updated_by = VALUES(updated_by)`,
      [type, body, userId || null]
    );
  },

  /** Remove an override so the built-in default applies again. */
  async resetTemplate(type) {
    await pool.query('DELETE FROM sms_templates WHERE template_type = ?', [type]);
  },

  /**
   * Send history, newest first. Filters are all optional.
   * @param {{type?:string, status?:string, q?:string, limit?:number}} opts
   */
  async logs({ type, status, q, limit = 200 } = {}) {
    const where = [];
    const params = [];
    if (type) { where.push('s.template_type = ?'); params.push(type); }
    if (status) { where.push('s.status = ?'); params.push(status); }
    if (q) {
      where.push('(c.name LIKE ? OR c.phone LIKE ? OR s.message LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    params.push(Math.min(Number(limit) || 200, 500));

    const [rows] = await pool.query(
      `SELECT s.id, s.template_type, s.message, s.status, s.sent_at,
              s.customer_id, s.job_id,
              c.name AS customer_name, c.phone,
              a.agreement_no
         FROM sms_logs s
         JOIN customers c ON s.customer_id = c.id
         LEFT JOIN jobs j ON s.job_id = j.id
         LEFT JOIN agreements a ON j.agreement_id = a.id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY s.sent_at DESC, s.id DESC
        LIMIT ?`,
      params
    );
    return rows;
  },

  /** Counts by status for the history header. */
  async logStats() {
    const [rows] = await pool.query(
      'SELECT status, COUNT(*) AS n FROM sms_logs GROUP BY status'
    );
    const stats = { total: 0 };
    rows.forEach((r) => { stats[r.status] = r.n; stats.total += r.n; });
    return stats;
  },

  /**
   * Has a reminder for this job already gone out on `runDate` (the day the cron
   * fires, not the visit date)?
   *
   * The cron's duplicate guard (Phase 5 issue #3) — a second run on the same day
   * must not text the same customer twice, while a job that gets postponed and
   * re-reminded on a later day still goes out.
   *
   * Anything except 'failed' counts as handled — including 'skipped-no-phone',
   * so a re-run doesn't pile up duplicate skip rows. A 'failed' attempt is left
   * open deliberately: that one is worth retrying.
   */
  async reminderAlreadySent(jobId, runDate) {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS n FROM sms_logs
        WHERE job_id = ? AND template_type = 'reminder'
          AND status <> 'failed'
          AND DATE(sent_at) = ?`,
      [jobId, runDate]
    );
    return row.n > 0;
  },
};

module.exports = SmsModel;
