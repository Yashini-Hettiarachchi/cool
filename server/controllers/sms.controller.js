/**
 * SMS controller — the office's window onto messaging.
 *
 * Three jobs: show and edit the three message templates, show the send history,
 * and fire a one-off test so the Text.lk credentials can be proven on a real
 * handset before the first customer ever depends on them.
 */
const SmsModel = require('../models/sms.model');
const JobModel = require('../models/job.model');
const sms = require('../services/smsService');
const { colomboToday, addDays } = require('../services/dateService');

/** Sample data used for the live preview of each template. */
const PREVIEW_DATA = {
  name: 'Nimal Perera',
  agreementNo: 'AS-00042',
  date: '2026-08-14',
};

const SmsController = {
  /**
   * GET /api/sms/templates
   * Each type comes back with its current body, the shipped default, whether an
   * override is in force, and a rendered preview — everything the editor needs
   * without a second round trip.
   */
  async templates(req, res, next) {
    try {
      const overrides = await SmsModel.templateOverrides();
      const byType = Object.fromEntries(overrides.map((o) => [o.template_type, o]));

      const templates = sms.TEMPLATE_TYPES.map((type) => {
        const override = byType[type];
        const body = override?.body?.trim() ? override.body : sms.DEFAULTS[type];
        return {
          type,
          body,
          default_body: sms.DEFAULTS[type],
          is_custom: body !== sms.DEFAULTS[type],
          placeholders: sms.PLACEHOLDERS[type],
          preview: sms.renderWith(body, PREVIEW_DATA),
          updated_at: override?.updated_at || null,
          updated_by_name: override?.updated_by_name || null,
        };
      });

      res.json({ templates, enabled: String(process.env.SMS_ENABLED).toLowerCase() === 'true' });
    } catch (err) { next(err); }
  },

  /**
   * PUT /api/sms/templates/:type  { body }
   *
   * Rejects a body that uses a token the template can't fill — a typo like
   * {custname} would otherwise ship to customers verbatim, since render() leaves
   * unknown tokens in place rather than blanking them.
   */
  async saveTemplate(req, res, next) {
    try {
      const { type } = req.params;
      if (!sms.TEMPLATE_TYPES.includes(type)) {
        return res.status(400).json({ error: `Unknown template type '${type}'` });
      }
      const body = (req.body?.body || '').trim();
      if (!body) return res.status(422).json({ error: 'Message body cannot be empty' });
      if (body.length > 600) return res.status(422).json({ error: 'Message body is too long (max 600 characters)' });

      const allowed = sms.PLACEHOLDERS[type];
      const used = [...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      const unknown = [...new Set(used.filter((t) => !allowed.includes(t)))];
      if (unknown.length) {
        return res.status(422).json({
          error: `Unknown placeholder${unknown.length > 1 ? 's' : ''}: {${unknown.join('}, {')}}. Allowed here: {${allowed.join('}, {')}}`,
        });
      }

      await SmsModel.saveTemplate(type, body, req.user.id);
      sms.invalidateTemplateCache();
      res.json({ type, body, preview: sms.renderWith(body, PREVIEW_DATA), is_custom: body !== sms.DEFAULTS[type] });
    } catch (err) { next(err); }
  },

  /** DELETE /api/sms/templates/:type — drop the override, restore the default. */
  async resetTemplate(req, res, next) {
    try {
      const { type } = req.params;
      if (!sms.TEMPLATE_TYPES.includes(type)) {
        return res.status(400).json({ error: `Unknown template type '${type}'` });
      }
      await SmsModel.resetTemplate(type);
      sms.invalidateTemplateCache();
      const body = sms.DEFAULTS[type];
      res.json({ type, body, preview: sms.renderWith(body, PREVIEW_DATA), is_custom: false });
    } catch (err) { next(err); }
  },

  /** GET /api/sms/logs?type=&status=&q=&limit= — send history. */
  async logs(req, res, next) {
    try {
      const { type, status, q, limit } = req.query;
      const [logs, stats] = await Promise.all([
        SmsModel.logs({ type, status, q, limit }),
        SmsModel.logStats(),
      ]);
      res.json({ logs, stats });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/sms/test  { phone, type? }
   *
   * The only way to prove the Text.lk path without waiting for a real customer
   * event. Deliberately NOT written to sms_logs: that table is the customer
   * notification record, and a staff test isn't one. The raw provider detail is
   * returned instead so a bad key or sender id is diagnosable from the screen.
   */
  async test(req, res, next) {
    try {
      const phone = (req.body?.phone || '').trim();
      if (!phone) return res.status(422).json({ error: 'A phone number is required' });

      const recipient = sms.normalisePhone(phone);
      if (recipient.length < 9) return res.status(422).json({ error: `'${phone}' is not a usable phone number` });

      const type = sms.TEMPLATE_TYPES.includes(req.body?.type) ? req.body.type : 'reminder';
      const message = await sms.render(type, PREVIEW_DATA);
      const result = await sms.sendSms(recipient, message);

      res.json({ recipient, type, message, status: result.status, detail: result.detail });
    } catch (err) { next(err); }
  },

  /**
   * GET /api/sms/reminders/preview?date=YYYY-MM-DD
   * Who the reminder cron would text for that visit date — lets the office see
   * the batch without waiting for 08:00. Defaults to tomorrow.
   */
  async remindersPreview(req, res, next) {
    try {
      const date = req.query.date || addDays(colomboToday(), 1);

      const jobs = await JobModel.listForReminder(date);
      const runDate = colomboToday();
      const rows = [];
      for (const job of jobs) {
        rows.push({
          ...job,
          already_sent: await SmsModel.reminderAlreadySent(job.id, runDate),
          has_phone: !!job.phone,
        });
      }
      res.json({ date, jobs: rows });
    } catch (err) { next(err); }
  },
};

module.exports = SmsController;
