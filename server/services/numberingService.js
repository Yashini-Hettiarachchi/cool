/**
 * AS- number generator.
 *
 * Format: AS-00001 (zero-padded 5-digit serial, global, never reused).
 * The wireframes hint at a possible date-encoded format later — this is the
 * single place to change if the client confirms it.
 *
 * Must run inside the same transaction/connection as the agreement insert so
 * two concurrent creations can't grab the same number.
 */
const PREFIX = 'AS-';
const PAD = 5;

async function nextAgreementNo(conn) {
  // Lock the latest row for the duration of the transaction.
  const [rows] = await conn.query(
    'SELECT agreement_no FROM agreements ORDER BY id DESC LIMIT 1 FOR UPDATE'
  );

  let next = 1;
  if (rows.length > 0) {
    const last = rows[0].agreement_no || '';
    const digits = last.replace(/[^0-9]/g, '');
    const n = parseInt(digits, 10);
    if (!Number.isNaN(n)) next = n + 1;
  }

  return `${PREFIX}${String(next).padStart(PAD, '0')}`;
}

module.exports = { nextAgreementNo };
