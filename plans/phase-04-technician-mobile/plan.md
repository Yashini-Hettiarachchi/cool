# Phase 4 — Technician Mobile Module

**Goal:** A technician can log in on a phone, search a job, upload 4–5 photos, tag the visit type, add a comment, and mark it complete (into the Job Complete Requests queue — not instantly finalized).

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 4).

## Tasks
- [x] `GET /api/jobs/by-agreement/:as_number` — technician lookup by AS- (all visits for the agreement)
- [x] `GET /api/jobs/mine/today` — today's jobs assigned to the caller
- [x] `PATCH /api/jobs/:id/status` — in_progress / completed; completed requires `service_type_used` (normal|hp), sets `admin_confirmed=FALSE`, stamps `completed_at`
- [x] Configure `multer` for uploads → `server/uploads/job_photos/`
- [x] `POST /api/jobs/:id/photos` — enforce **max 5**, 5MB each, image-only (server-side); rolls back files if the cap is exceeded
- [x] `GET /api/jobs/:id/photos` + `GET /api/jobs/:id/photos/:photoId` — authenticated list + file stream (not public)
- [x] Ownership guard: technicians may only read/act on jobs assigned to them (office roles bypass)
- [x] Frontend `TodayJobs.jsx`, `JobSearch.jsx`, `JobDetail.jsx` with `<input type="file" capture="environment" multiple>`, Normal/H-P selector, comments
- [x] Mobile-first CSS — large touch targets, single-column, sticky Complete bar

**Decision (client, 2026-07-22):** dropped the hard **min-4** completion gate — technicians just upload photos (max 5 kept as a safety cap). Completion requires only a service-type choice.

## Checkpoint ✅
Technician workflow verified end-to-end against the live DB: login → today's list → AS- search → detail → start → upload photos → complete. Completion lands in the approval queue (`admin_confirmed=FALSE`), not finalized. Ownership, auth-only photo retrieval, and the max-5 cap all enforced server-side.
