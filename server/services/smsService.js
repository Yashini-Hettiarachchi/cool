/**
 * SMS service — Text.lk wrapper + template rendering.
 *
 * Runs in log-only mode until SMS_ENABLED=true and a Text.lk API key is set.
 * Every send is recorded in sms_logs (status 'sent' | 'failed' | 'logged'),
 * and a send failure NEVER throws out of the calling flow — agreement/job
 * creation must not be blocked by SMS problems (Phase 2 issue #4).
 *
 * Templates: the wording below is the shipped default. The office can override
 * any of the three from the SMS Centre (rows in `sms_templates`), which is
 * deliberate — the client had not finalised wording at build time (Phase 5
 * issue #5). Overrides are cached for TEMPLATE_TTL_MS so rendering stays cheap;
 * an edit busts the cache immediately.
 */
const { pool } = require('../config/db');

/** Placeholder tokens each template may use — surfaced to the editing UI. */
const PLACEHOLDERS = {
  activation: ['name', 'agreementNo'],
  reminder: ['name', 'date'],
  completion: ['name', 'agreementNo'],
};

const DEFAULTS = {
  activation: 'Dear {name}, your AC service agreement {agreementNo} is now active. Thank you for choosing Highcool.',
  reminder: 'Dear {name}, this is a reminder that your AC service is scheduled for {date}. - Highcool',
  completion: 'Dear {name}, your AC service for {agreementNo} is complete. Thank you for choosing Highcool.',
};

const TEMPLATE_TYPES = Object.keys(DEFAULTS);

const TEMPLATE_TTL_MS = 60_000;
let cache = { at: 0, bodies: null };

/** Drop the override cache — called after an admin edit so it takes effect now. */
function invalidateTemplateCache() {
  cache = { at: 0, bodies: null };
}

/**
 * Current template bodies (defaults merged with DB overrides).
 *
 * A DB problem here must not stop an SMS going out, so a failed read falls back
 * to the built-in defaults rather than throwing — that also covers an install
 * that hasn't re-run schema.sql yet and has no sms_templates table.
 */
async function getTemplates() {
  if (cache.bodies && Date.now() - cache.at < TEMPLATE_TTL_MS) return cache.bodies;

  const bodies = { ...DEFAULTS };
  try {
    const [rows] = await pool.query('SELECT template_type, body FROM sms_templates');
    rows.forEach((r) => {
      if (TEMPLATE_TYPES.includes(r.template_type) && r.body?.trim()) bodies[r.template_type] = r.body;
    });
  } catch (err) {
    console.warn('[sms:templates] falling back to defaults:', err.message);
  }

  cache = { at: Date.now(), bodies };
  return bodies;
}

/** Substitute {token}s. An unknown token is left as-is so the gap is visible. */
function fill(body, data) {
  return body.replace(/\{(\w+)\}/g, (match, key) => (data[key] === undefined || data[key] === null ? match : String(data[key])));
}

/**
 * Render a template. Async because wording may live in the DB.
 * @param {'activation'|'reminder'|'completion'} type
 */
async function render(type, data = {}) {
  if (!TEMPLATE_TYPES.includes(type)) throw new Error(`Unknown SMS template: ${type}`);
  const bodies = await getTemplates();
  return fill(bodies[type], data);
}

/** Render from an explicit body — used to preview an unsaved edit. */
function renderWith(body, data = {}) {
  return fill(body, data);
}

/**
 * Normalise a Sri Lankan number to the international form Text.lk expects.
 *   0771234567 -> 94771234567 · +94 77 123 4567 -> 94771234567
 * Anything that doesn't look local is passed through digits-only, so a number
 * already stored in international form still works.
 */
function normalisePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  if (digits.length === 9) return `94${digits}`; // 771234567
  return digits;
}

/**
 * Send an SMS via Text.lk (or log-only). Returns { status, message, detail }.
 *
 * `status` is what lands in sms_logs:
 *   'logged' — SMS disabled or no API key; we only printed it
 *   'sent'   — Text.lk accepted it
 *   'failed' — network error, timeout, or a non-2xx / error payload
 * Never throws: the caller's business action has already happened.
 */
async function sendSms(phone, message) {
  const enabled = String(process.env.SMS_ENABLED).toLowerCase() === 'true';
  const apiKey = process.env.TEXTLK_API_KEY;
  const recipient = normalisePhone(phone);

  if (!recipient) return { status: 'failed', message, detail: 'No phone number' };

  if (!enabled || !apiKey) {
    console.log(`[sms:log-only] -> ${recipient}: ${message}`);
    return { status: 'logged', message, detail: 'SMS_ENABLED is off (log-only mode)' };
  }

  try {
    // A hung provider must not hold a request (or the cron batch) open forever.
    const res = await fetch('https://app.text.lk/api/v3/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        recipient,
        sender_id: process.env.TEXTLK_SENDER_ID || 'TextLK',
        type: 'plain',
        message,
      }),
      signal: AbortSignal.timeout(Number(process.env.SMS_TIMEOUT_MS) || 15000),
    });

    // Text.lk answers 200 with {status:'error'} for things like an invalid
    // sender id, so the body has to be inspected — res.ok alone would report a
    // rejected message as sent.
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(body?.message || `Text.lk HTTP ${res.status}`);
    }
    if (body && String(body.status).toLowerCase() === 'error') {
      throw new Error(body.message || 'Text.lk rejected the message');
    }
    return { status: 'sent', message, detail: body?.message || 'Accepted by Text.lk' };
  } catch (err) {
    const detail = err.name === 'TimeoutError' ? 'Text.lk timed out' : err.message;
    console.error('[sms:error]', detail);
    return { status: 'failed', message, detail };
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

module.exports = {
  render,
  renderWith,
  sendSms,
  logSms,
  getTemplates,
  invalidateTemplateCache,
  normalisePhone,
  DEFAULTS,
  PLACEHOLDERS,
  TEMPLATE_TYPES,
};
