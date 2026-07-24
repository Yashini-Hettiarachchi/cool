# Phase 8 — Reporting Dashboard

**Goal:** Admin can view how many jobs each technician actually had confirmed-complete over a chosen period.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 8).

## Tasks
- [ ] `GET /api/reports/technician/:id?range=day|week|month` — counts only **admin-confirmed** completions
- [ ] Frontend `Reports.jsx` — technician selector + date range + count display (table or simple chart)

## Checkpoint
Per-technician confirmed-complete counts over a chosen period display correctly.
