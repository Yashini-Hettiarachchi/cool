# Phase 3 — Calendar, Scheduling, Assignment, Postpone/Cancel

**Goal:** Jobs appear color-coded on a calendar; admin can assign a technician, postpone (days + reason), cancel (reason), or soft-delete a mistaken entry — each tracked separately.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 3).

## Tasks
- [x] `GET /api/jobs?date=` — jobs for a specific day (join agreement + customer)
- [x] `PATCH /api/jobs/:id/assign` — assign technician
- [x] `PATCH /api/jobs/:id/postpone` — days + reason, shifts `scheduled_date`, sets `postponed_from`, status `postponed`
- [x] `PATCH /api/jobs/:id/cancel` — reason, status `cancelled`
- [x] `PATCH /api/jobs/:id/soft-delete` — `is_deleted = TRUE` (distinct from cancel)
- [x] Frontend `Calendar.jsx` — month/year filter, status counters, color-coded cells (🔴 Active, 🟠 Postponed, 🟢 Complete)
- [x] Frontend `JobSlot.jsx` — job detail: Postpone / Cancel / Print / Download PDF / Comments
- [x] Frontend `DeletedJobs.jsx` and `JobCancellations.jsx` (two separate admin views)
- [x] Technician assignment UI (select on a job)

## Checkpoint
Color-coded calendar; assign / postpone-with-reason / cancel-with-reason / soft-delete all work and are tracked as distinct states and views.
