# Phase 4 — Technician Mobile Module

**Goal:** A technician can log in on a phone, search a job, upload 4–5 photos, tag the visit type, add a comment, and mark it complete (into the Job Complete Requests queue — not instantly finalized).

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 4).

## Tasks
- [ ] `GET /api/jobs/:as_number` — technician lookup by AS-
- [ ] `PATCH /api/jobs/:id/status` — in_progress / completed; completed requires `service_type_used` (normal|hp), sets `admin_confirmed=FALSE`
- [ ] Configure `multer` for uploads → `server/uploads/job_photos/`
- [ ] `POST /api/jobs/:id/photos` — enforce **min 4 / max 5**, 5MB each (server-side count + size); block Complete under 4
- [ ] `GET /api/jobs/:id/photos/:photoId` — authenticated retrieval (not public)
- [ ] Frontend `TodayJobs.jsx`, `JobSearch.jsx`, `JobDetail.jsx` with `<input type="file" capture="environment" multiple>`, Normal/H-P selector, comments
- [ ] Mobile-first CSS — large touch targets, single-column

## Checkpoint
Technician workflow works end-to-end on a phone; completion lands in the queue, not finalized.
