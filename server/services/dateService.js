/**
 * Calendar-date helpers pinned to the business timezone.
 *
 * Why this exists: the reminder cron asks "what is scheduled tomorrow?", and
 * `scheduled_date` is a plain DATE in Sri Lankan terms. A cPanel box set to UTC
 * is 5h30m behind Colombo, so between 18:30 and midnight local time the server's
 * own "today" is already the previous day — the 08:00 cron would be fine, but a
 * manual re-run in the evening would silently remind the wrong day's customers
 * (Phase 5 issue #7). Deriving the date in Asia/Colombo removes that dependency
 * on how the host happens to be configured.
 */

const BUSINESS_TZ = process.env.BUSINESS_TZ || 'Asia/Colombo';

/** Today's calendar date in the business timezone, as 'YYYY-MM-DD'. */
function colomboToday(now = new Date()) {
  // en-CA formats as YYYY-MM-DD, which is exactly MySQL's DATE literal.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Shift a 'YYYY-MM-DD' string by N days (calendar arithmetic, no tz drift). */
function addDays(date, days) {
  const [y, m, d] = String(date).split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' → '14 August 2026', for message text and the job card. */
function longDate(date) {
  const [y, m, d] = String(date).split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** True for a well-formed 'YYYY-MM-DD'. */
function isDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

module.exports = { BUSINESS_TZ, colomboToday, addDays, longDate, isDateString };
