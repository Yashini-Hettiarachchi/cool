# Phase 7 — Archive, Renewal, Deleted Jobs, Job Cancellations

**Goal:** Cancelling moves an agreement to Archive (not deleted); renewing creates a fresh AS- linked to history, pre-filled from the old record; Deleted Jobs and Job Cancellations show correctly as separate lists.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 7).

## Tasks
- [ ] `POST /api/agreements/:id/cancel` — soft-delete, status `cancelled`
- [ ] `GET /api/agreements/archived` — cancelled agreements
- [ ] `GET /api/agreements/search` (ID/AS-/Phone) — powers Renew search
- [ ] `POST /api/agreements/:id/renew` — new AS-, `parent_agreement_id` link, old → `renewed`; pre-fills Model/Brand/Serials/Normal/H-P/Period/Price; re-runs scheduler
- [ ] Frontend `Archive.jsx`, `RenewAgreement.jsx` (search → reuse NewAgreement form, pre-filled)
- [ ] Confirm `DeletedJobs.jsx` / `JobCancellations.jsx` (Phase 3) wired to their queries

## Checkpoint
Cancel → Archive; Renew → new linked AS- pre-filled; Deleted vs Cancellations shown as separate lists.
