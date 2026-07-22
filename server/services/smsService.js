/**
 * SMS service — Text.lk wrapper + template rendering.
 *
 * Runs in log-only mode until SMS_ENABLED=true and a Text.lk API key is set.
 * Every send is recorded in sms_logs (status 'sent' | 'failed' | 'logged'),
 * and a send failure NEVER throws out of the calling flow — agreement/job
 * creation must not be blocked by SMS problems (Phase 2 issue #4).
 */

const TEMPLATES = {
  activation: ({ name, agreementNo }) =>
    `Dear ${name}, your AC service agreement ${agreementNo} is now active. Thank you for choosing Highcool. `,
  reminder: ({ name, date }) =>
    `Dear ${name}, this is a reminder that your AC service is scheduled for ${date}. - Highcool`,
  completion: ({ name, agreementNo }) =>
    `Dear ${name}, your AC service for ${agreementNo} is complete. Thank you for choosing Highcool.`,
};

function render(type, data) {
  const fn = TEMPLATES[type];
  if (!fn) throw new Error(`Unknown SMS template: ${type}`);
  return fn(data);
}

/**
 * Send an SMS via Text.lk (or log-only). Returns { status, message }.
 * @param {string} phone
 * @param {string} message
 */
async function sendSms(phone, message) {
  const enabled = String(process.env.SMS_ENABLED).toLowerCase() === 'true';
  const apiKey = process.env.TEXTLK_API_KEY;

  if (!enabled || !apiKey) {
    console.log(`[sms:log-only] -> ${phone}: ${message}`);
    return { status: 'logged', message };
  }

  try {
    const res = await fetch('https://app.text.lk/api/v3/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        recipient: phone,
        sender_id: process.env.TEXTLK_SENDER_ID || 'TextLK',
        type: 'plain',
        message,
      }),
    });
    if (!res.ok) throw new Error(`Text.lk HTTP ${res.status}`);
    return { status: 'sent', message };
  } catch (err) {
    console.error('[sms:error]', err.message);
    return { status: 'failed', message };
  }
}

/**
 * Record an SMS in sms_logs. Uses the given connection if provided (so it can
 * join an agreement-creation transaction), else the shared pool.
 */
async function logSms(db, { customerId, jobId = null, templateType, message, status }) {
  await db.query(
    'INSERT INTO sms_logs (customer_id, job_id, template_type, message, status) VALUES (?, ?, ?, ?, ?)',
    [customerId, jobId, templateType, message, status]
  );
}

module.exports = { render, sendSms, logSms, TEMPLATES };
