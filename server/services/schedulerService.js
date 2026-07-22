/**
 * Job scheduler — generates the year's visits for a new agreement.
 *
 * Rule (design plan #3): an agreement allocates (normal_count + hp_count) visits,
 * spaced `period_days` apart, starting `period_days` after the start date.
 * The actual type (normal/hp) is NOT pre-assigned — the technician tags it when
 * the visit is performed (design plan #4).
 */

/**
 * Insert the scheduled jobs for an agreement, within the given connection.
 * @param {object} conn - active mysql2 connection (inside a transaction)
 * @param {number} agreementId
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {number} totalVisits - normal_count + hp_count
 * @param {number} periodDays
 * @returns {number} number of jobs created
 */
async function generateJobs(conn, agreementId, startDate, totalVisits, periodDays) {
  if (totalVisits < 1) return 0;

  const values = [];
  const placeholders = [];
  for (let i = 1; i <= totalVisits; i += 1) {
    const offset = periodDays * i;
    // scheduled_date = startDate + (periodDays * i) days, computed in SQL.
    placeholders.push('(?, DATE_ADD(?, INTERVAL ? DAY), ?)');
    values.push(agreementId, startDate, offset, 'scheduled');
  }

  await conn.query(
    `INSERT INTO jobs (agreement_id, scheduled_date, status) VALUES ${placeholders.join(', ')}`,
    values
  );

  return totalVisits;
}

module.exports = { generateJobs };
