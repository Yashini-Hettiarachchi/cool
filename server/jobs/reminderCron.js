#!/usr/bin/env node
/**
 * Day-before reminder SMS — standalone cron script (Phase 5).
 *
 * Run once a day from cPanel's cron manager, NOT from inside the Express app:
 *
 *   0 8 * * * /usr/bin/node /home/<cpanel-user>/ac-service-app/server/jobs/reminderCron.js >> /home/<cpanel-user>/logs/reminders.log 2>&1
 *
 * Passenger recycles the web process whenever it idles, so an in-process
 * scheduler (node-cron) would simply stop firing — hence a separate invocation
 * the host is responsible for.
 *
 * Three things this script must get right (Phase 5 issues #2, #3, #6):
 *   1. cron inherits none of the app's environment → .env is loaded explicitly
 *      from an absolute path, not the working directory.
 *   2. a second run on the same day must not text anyone twice → every job is
 *      checked against sms_logs first.
 *   3. it has to exit → the MySQL pool is closed and the exit code set, or the
 *      process would sit open holding a connection.
 *
 * Usage:
 *   node jobs/reminderCron.js                  # remind tomorrow's visits
 *   node jobs/reminderCron.js --date=2026-08-14  # remind a specific visit date
 *   node jobs/reminderCron.js --dry-run        # list who would be texted, send nothing
 */

const path = require('path');

// Absolute path: cron's cwd is the user's home, not server/.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('../config/db');
const JobModel = require('../models/job.model');
const SmsModel = require('../models/sms.model');
const sms = require('../services/smsService');
const { colomboToday, addDays, longDate, isDateString } = require('../services/dateService');

function parseArgs(argv) {
  const dateArg = argv.find((a) => a.startsWith('--date='));
  return {
    dryRun: argv.includes('--dry-run'),
    date: dateArg ? dateArg.slice('--date='.length) : null,
  };
}

async function main() {
  const { dryRun, date: dateOverride } = parseArgs(process.argv.slice(2));

  if (dateOverride && !isDateString(dateOverride)) {
    throw new Error(`--date must be YYYY-MM-DD (got '${dateOverride}')`);
  }

  const runDate = colomboToday();
  const visitDate = dateOverride || addDays(runDate, 1);

  console.log(`[reminders] run ${runDate} (Asia/Colombo) → visits on ${visitDate}${dryRun ? ' [DRY RUN]' : ''}`);

  const jobs = await JobModel.listForReminder(visitDate);
  if (!jobs.length) {
    console.log('[reminders] nothing scheduled — done.');
    return 0;
  }
  console.log(`[reminders] ${jobs.length} visit(s) to consider`);

  const tally = { sent: 0, logged: 0, failed: 0, skipped: 0 };

  for (const job of jobs) {
    const who = `job ${job.id} (${job.agreement_no}, ${job.customer_name})`;
    try {
      if (await SmsModel.reminderAlreadySent(job.id, runDate)) {
        console.log(`[reminders] skip ${who}: already handled today`);
        tally.skipped += 1;
        continue;
      }

      if (!job.phone) {
        // Recorded rather than dropped, so the office can see who wasn't told.
        console.warn(`[reminders] skip ${who}: no phone on file`);
        tally.skipped += 1;
        if (!dryRun) {
          await sms.logSms(pool, {
            customerId: job.customer_id,
            jobId: job.id,
            templateType: 'reminder',
            message: '(not sent — customer has no phone number)',
            status: 'skipped-no-phone',
          });
        }
        continue;
      }

      const message = await sms.render('reminder', {
        name: job.customer_name,
        date: longDate(job.scheduled_date),
      });

      if (dryRun) {
        console.log(`[reminders] would send -> ${sms.normalisePhone(job.phone)}: ${message}`);
        tally.skipped += 1;
        continue;
      }

      const result = await sms.sendSms(job.phone, message);
      await sms.logSms(pool, {
        customerId: job.customer_id,
        jobId: job.id,
        templateType: 'reminder',
        message,
        status: result.status,
      });
      tally[result.status] = (tally[result.status] || 0) + 1;
      console.log(`[reminders] ${result.status} ${who}${result.detail ? ` — ${result.detail}` : ''}`);
    } catch (err) {
      // One bad number, one provider hiccup, one row with odd data: log it and
      // keep going. Aborting the batch would punish every customer after this
      // one (Phase 5 issue #4).
      tally.failed += 1;
      console.error(`[reminders] error on ${who}: ${err.message}`);
    }
  }

  console.log(`[reminders] done — sent ${tally.sent}, log-only ${tally.logged}, failed ${tally.failed}, skipped ${tally.skipped}`);
  return tally.failed > 0 ? 1 : 0;
}

main()
  .then(async (code) => {
    // The pool keeps the event loop alive; without this the cron process hangs.
    await pool.end();
    process.exit(code);
  })
  .catch(async (err) => {
    console.error('[reminders] fatal:', err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  });
