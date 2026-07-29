# Phase 5 — SMS Automation & Job Complete Requests ✅

**Goal:** Technician completions land in a review queue; admin confirmation fires the Completion SMS and logs it; reminder cron runs on schedule.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 5).

## Tasks
- [x] Finalize `smsService.js` template rendering (activation, reminder, completion)
- [x] `jobs/reminderCron.js` — query jobs scheduled for tomorrow (status scheduled), send reminder SMS, log to `sms_logs`
- [x] cPanel cron entry (daily ~8am) → `reminderCron.js` — documented in [RUN.md](../../../RUN.md#reminder-sms-the-daily-cron); the entry itself gets added at Phase 9 deploy time
- [x] `GET /api/jobs/complete-requests` — `status='completed' AND admin_confirmed=FALSE`
- [x] `PATCH /api/jobs/:id/confirm` — Admin/System User confirms; sets `admin_confirmed=TRUE`; **triggers Completion SMS**
- [x] Frontend `CompleteRequests.jsx` — review queue with photos/comments + Confirm
- [x] `GET /api/sms/templates` + admin UI to edit wording
- [x] `GET /api/sms/logs` — admin SMS history

## What was built (2026-07-29)

### `sms_templates` — editable wording
A 10th table, holding **overrides only**. A type with no row uses the default in
`services/smsService.js`, so a database that predates this phase still sends
correct messages. Bodies use `{name}` / `{agreementNo}` / `{date}` tokens;
`PUT /api/sms/templates/:type` rejects a token the template can't fill, because
`render()` deliberately leaves unknown tokens in place rather than blanking them —
a typo like `{custname}` would otherwise reach customers verbatim.

Overrides are cached in-process for 60s and the cache is busted on save.
`render()` became **async** as a result; the two callers were updated, and the
activation SMS in `agreements.controller` now renders *after* commit so the
template read can't take a second pool connection while a transaction holds one.

### `jobs/reminderCron.js` — standalone, not in-process
Runs from cPanel cron, not `node-cron`: Passenger recycles the web process on
idle, so an in-process timer stops firing. Handles the three constraints from
`issues.md`: loads `.env` by absolute path, refuses to double-send (checks
`sms_logs` for a non-failed reminder for that job on that run date), and closes
the pool + sets an exit code so the process can't hang. One bad message never
aborts the batch. Supports `--dry-run` and `--date=YYYY-MM-DD`.

"Tomorrow" is computed in **Asia/Colombo** via `services/dateService.js` rather
than from the host clock (issue #7) — a UTC cPanel box is 5h30m behind, so an
evening re-run would otherwise target the wrong day.

### Text.lk hardening
`sendSms` now normalises local numbers to `94…`, times out (`SMS_TIMEOUT_MS`,
default 15s), and **inspects the response body** — Text.lk answers HTTP 200 with
`{status:'error'}` for an unapproved sender ID, which the old `res.ok` check
would have recorded as sent. Failures carry the provider's own message through
to the screen.

### SMS Centre (`/sms`)
Office-visible page with three tabs — **Templates** (edit + live preview +
character/segment count, admin-only), **History** (every `sms_logs` row, filterable
by type/status/free text, with counts), **Reminders** (exactly who tomorrow's cron
would text, and who it would skip). Plus an admin-only **test send** that fires one
message to a chosen number with sample data and is *not* written to customer
history — the only way to prove the credentials before a customer depends on them.

## Checkpoint
✅ Confirm-completion fires + logs the Completion SMS.
✅ Reminder cron verified locally: dry run, real run, and a second run correctly
skipping everything it had already handled.
⬜ **Not yet proven:** a real delivery through Text.lk. That needs live
credentials — see RUN.md → "Turning live SMS on".
