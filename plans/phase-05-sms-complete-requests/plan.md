# Phase 5 — SMS Automation & Job Complete Requests

**Goal:** Technician completions land in a review queue; admin confirmation fires the Completion SMS and logs it; reminder cron runs on schedule.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 5).

## Tasks
- [ ] Finalize `smsService.js` template rendering (activation, reminder, completion)
- [ ] `jobs/reminderCron.js` — query jobs scheduled for tomorrow (status scheduled), send reminder SMS, log to `sms_logs`
- [ ] cPanel cron entry (daily ~8am) → `reminderCron.js`
- [ ] `GET /api/jobs/complete-requests` — `status='completed' AND admin_confirmed=FALSE`
- [ ] `PATCH /api/jobs/:id/confirm` — Admin/System User confirms; sets `admin_confirmed=TRUE`; **triggers Completion SMS**
- [ ] Frontend `JobCompleteRequests.jsx` — review queue with photos/comments + Confirm
- [ ] `GET /api/sms/templates` + admin UI to edit wording
- [ ] `GET /api/sms/logs` — admin SMS history

## Checkpoint
Confirm-completion fires + logs the Completion SMS; reminder cron sends day-before reminders on schedule.
