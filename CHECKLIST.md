# Build Checklist — Highcool AC Service Management System

**What's left to do.** This is the forward-looking companion to [WORKLOG.md](WORKLOG.md) (which records what's *already done*). Detailed per-phase tasks live in [docs/plans/](docs/plans/); this is the running top-level view.

Legend: `[ ]` to do · `[~]` partially done · `[x]` done

---

## Done (see WORKLOG for detail)
- [x] **Phase 1** — Project setup, DB schema, auth, Admin user & pricing management
- [x] **Phase 2** — Customer & agreement registration (AS- numbering, auto-scheduled jobs)
- [x] **Phase 3** — Calendar, technician assignment, postpone / cancel / soft-delete
- [x] **Phase 4** — Technician mobile module (today's jobs, AS- search, start/complete, photo upload)

---

## Roles — System User (office staff) ⚠️
The `system_user` role is **plumbed in but never verified end-to-end**, and the one office function unique to it (confirming completions) isn't built yet.

- [x] Backend office routes allow `admin` + `system_user`; `users` & `pricing` are admin-only
- [x] Admin can create a System User account (AddUsers → role dropdown)
- [x] Frontend routes/sidebar treat `system_user` as office (no Users/Pricing nav)
- [ ] **Verify a System User end-to-end** — log in as a `system_user`, confirm access to Customers / New Agreement / Calendar / Jobs / Cancellations / Deleted Jobs, and confirm they are **blocked (403)** from `/api/users` and `/api/pricing` and don't see those nav items
- [ ] **Completion approval queue** (the main shared admin/system_user job) — *see Phase 5 below*; without it, technician completions pile up with `admin_confirmed=FALSE` and nobody can confirm them
- [ ] Seed or document a default System User login for testing (only `admin` + technicians exist today)

---

## Phase 5 — SMS & Job Complete Requests  ⬅️ next
**Goal:** technician completions land in a review queue; admin/system-user confirmation fires the Completion SMS and logs it; reminder cron runs on schedule.
- [ ] `GET /api/jobs/complete-requests` — list jobs where `status='completed'` AND `admin_confirmed=FALSE` (with photos, comments, service type)
- [ ] `PATCH /api/jobs/:id/confirm` — admin/system_user sets `admin_confirmed=TRUE`; **this** fires the Completion SMS (not the technician's Complete tap)
- [ ] "Job Complete Requests" review screen — photo/comment review, Confirm button (the Dashboard already counts `pendingApprovals`, but nothing opens the queue yet)
- [ ] Completion SMS template + log to `sms_logs`
- [ ] Reminder cron (upcoming visits) on schedule
- [ ] Flip `SMS_ENABLED=true` path verified against Text.lk (currently log-only)

## Phase 6 — Job Card Print / PDF
**Goal:** a job card can be opened, printed, and downloaded as a PDF cleanly.
- [ ] Job card view (print-friendly layout)
- [ ] Print stylesheet + Download-as-PDF

## Phase 7 — Archive & Renewal
**Goal:** cancelling archives an agreement (not deleted); renewing creates a fresh AS- linked to history, pre-filled from the old record.
- [ ] Agreement archive on cancel (distinct from job cancel/soft-delete)
- [ ] Renew flow — new AS- linked via `parent_agreement_id`, pre-filled from prior record, loyalty year continuity
- [ ] Confirm Deleted Jobs vs Job Cancellations remain distinct lists

## Phase 8 — Reporting
**Goal:** admin can see how many jobs each technician actually had confirmed-complete over a chosen period.
- [ ] Per-technician confirmed-completion counts over a date range
- [ ] Report screen + date-range filter

## Phase 9 — Deployment
**Goal:** full app live on the temporary hosting URL.
- [ ] Build client, deploy server to cPanel/Passenger, connect cPanel MySQL
- [ ] Env/secrets on host; static `/admin` serving verified in prod
- [ ] Smoke-test all roles on the live URL

## Phase 10 — Domain Go-Live
**Goal:** system live on the real `.lk` domain with SSL, validated with the client.
- [ ] Point `.lk` domain, install SSL
- [ ] Final client walkthrough & sign-off

---

## Cross-cutting / polish (not phase-specific)
- [ ] JWT is memory-only → lost on refresh (accepted for v1; revisit if the client wants "stay logged in")
- [ ] Confirm Sinhala `route` text renders correctly via real browser input (curl showed `??????` — encoding artifact)
- [ ] Decide fate of the dev-DB sample data left by testing (`testtech`, AS-00001 visit #1 completed) before any client demo
- [ ] Clean up stray root file `bash.exe.stackdump` if not needed
