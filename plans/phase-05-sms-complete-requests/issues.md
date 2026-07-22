# Phase 5 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **Completion SMS must fire on admin confirm, NOT technician tap.** | The `PATCH /confirm` handler is the *only* place that sends the completion SMS. Technician "Complete" only sets status + `admin_confirmed=FALSE`. |
| 2 | **cPanel cron uses full node path & absolute script path.** | Document exact entry: `0 8 * * * /usr/bin/node /home/<user>/ac-service-app/server/jobs/reminderCron.js`. Cron loads its own env — read `.env` explicitly in the script. |
| 3 | **Duplicate reminders** if cron runs twice or job re-queried. | Mark/record a reminder-sent flag or check `sms_logs` for an existing reminder for that job+date before sending. |
| 4 | **Text.lk rate limits / downtime.** | Catch and log per-message failures with `status='failed'`; don't let one failure abort the whole cron batch. |
| 5 | **Template wording not finalized by client** (open item). | Keep templates in DB/config editable via admin UI; ship sensible defaults. |
| 6 | **Cron script must exit** — hanging DB pool keeps process alive. | Explicitly `pool.end()` / `process.exit(0)` at the end of the cron run. |
| 7 | **Timezone for "tomorrow"** — server tz vs Sri Lanka (Asia/Colombo). | Pin tz handling; compute "tomorrow" in Asia/Colombo consistently. |
