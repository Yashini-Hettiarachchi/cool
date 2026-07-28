# Build Checklist — Highcool AC Service Management System

**What's left to do.** This is the forward-looking companion to [WORKLOG.md](WORKLOG.md) (which records what's *already done*). Detailed per-phase tasks live in [docs/plans/](docs/plans/); this is the running top-level view.

Legend: `[ ]` to do · `[~]` partially done · `[x]` done

---

## Where we are — 2026-07-28

**The core business loop is complete and live-verified:** register a customer → auto-generate their year of visits → assign a technician → technician works the job on their phone with photos → office reviews and approves → customer is notified.

| Phase | State |
|---|---|
| 1 — Setup, DB, auth, users, pricing | ✅ verified |
| 2 — Customers & agreements (AS- numbering, auto-scheduling) | ✅ verified |
| 3 — Calendar, assignment, postpone / cancel / soft-delete | ✅ verified |
| 4 — Technician mobile module | ✅ verified |
| 5 — SMS & completion approvals | 🔶 core done; reminder cron + live Text.lk left |
| 6 — Job card print / PDF | ⬜ not started |
| 7 — Archive & renewal | ⬜ not started (only the DB column exists) |
| 8 — Reporting | ⬜ not started |
| 9 — Deployment | ⬜ not started |
| 10 — Domain go-live | ⬜ not started |

**~60% of the build**, weighted by effort rather than phase count (1–4 were the bulk; 6 and 8 are small additive screens). **Phase 7 is the only core business logic left** — everything else remaining is a convenience screen or deployment.

### Built but never proven ⚠️
These read as done but carry real risk, because no one has ever exercised them:
1. **The `system_user` role** — plumbed through backend and frontend since Phase 1; no account of that role has ever been created or logged in (see the section below).
2. **Live SMS** — the Text.lk HTTP call has never executed. Log-only mode proves our side, not theirs.
3. **Nothing has ever run off this machine** — no cPanel deploy, no Passenger, no remote MySQL. Phase 9 is where surprises usually live.

> **Shortest path to a client-visible URL** is arguably **Phase 9 before 6/7/8** — deploy what already works, then keep building against a live environment, rather than hitting every deployment surprise at once later.

---

## Done (see WORKLOG for detail)
- [x] **Phase 1** — Project setup, DB schema, auth, Admin user & pricing management
- [x] **Phase 2** — Customer & agreement registration (AS- numbering, auto-scheduled jobs)
- [x] **Phase 3** — Calendar, technician assignment, postpone / cancel / soft-delete
- [x] **Phase 4** — Technician mobile module (today's jobs, AS- search, start/complete, photo upload)

### Post–Phase 4 enhancements (client feedback, 2026-07-24)
- [x] Consolidated all docs under a single root **`docs/`** folder (design-plans, plans, wireframes)
- [x] **Customers page lists all customers by default** (`GET /api/customers`), search still filters incl. AS-, agreement-count column
- [x] **Assignments board** (`/assignments`) — one list of upcoming visits, Unassigned/All filter, **inline technician dropdown** so admin/system-user can assign without opening the calendar
- [x] **Reusable pagination** across Customers/Assignments/Cancellations/Deleted Jobs/Users/Dashboard; SVG-chevron buttons; centered layout fix; **dashboard redesign** (light hero, KPI reorder, 2-column)
- [x] **Completion Approvals screen** (`/complete-requests`) — admin reviews technician photos & approves (`PATCH /jobs/:id/confirm`); technician can now see their own uploaded photos
- [x] **Sidebar "Approvals" notification badge** — live pending count (polls `/jobs/stats` + refreshes instantly on approve via an `approvals-changed` event)
- [x] **Photo lightbox** — approval photos open in an in-window popup (prev/next, Esc/click-out) instead of a new browser tab
- [x] **Approved-jobs history** — Approvals screen has **Pending / Approved** tabs (`GET /jobs/complete-requests?status=approved`) so already-confirmed completions stay trackable
- [x] Fixed blank job-detail pages and the Assignments missing-icon

### UI/UX polish pass (client feedback, 2026-07-26)
- [x] **Approvals two-step confirm** — Approve now asks for inline confirmation (names the agreement, warns it notifies the customer) so it can't be misfired
- [x] **New Agreement live payment check** — pink/green feedback when amount paid is short of / matches the agreed price
- [x] **Calendar legend** — added the missing `in_progress` status key
- [x] **Technician "My Jobs" shows all assigned jobs by default** (`GET /api/jobs/mine`), with All/Today/To do/Done filters + tonal KPI strip
- [x] **Technician surface uses full width** (was a 640px column) — responsive job-card grid, status accent stripes, two-column Job Detail work order, phone-down responsive rules
- [x] Fixed the leaking native "Choose Files" input (global `[hidden]` reset); made the photo **Add** tile interactive
- [x] **Committed a checkpoint** — repo `git init`-ed and all of the above landed on `main` (HEAD `b600fc7`); working tree clean as of 2026-07-28

---

## Roles — System User (office staff) ⚠️
The `system_user` role is **plumbed in but never verified end-to-end** — no account of this role has ever been created or logged in. (The approval queue it exists to serve is now built.)

- [x] Backend office routes allow `admin` + `system_user`; `users` & `pricing` are admin-only
- [x] Admin can create a System User account (AddUsers → role dropdown)
- [x] Frontend routes/sidebar treat `system_user` as office (no Users/Pricing nav)
- [ ] **Verify a System User end-to-end** — log in as a `system_user`, confirm access to Customers / New Agreement / Calendar / Jobs / Cancellations / Deleted Jobs, and confirm they are **blocked (403)** from `/api/users` and `/api/pricing` and don't see those nav items. *Blocked on the item below: no `system_user` account exists to test with.*
- [x] **Completion approval queue** — built (`/complete-requests`); admin/system_user reviews photos & confirms, and approval now fires the customer's completion SMS (2026-07-28).
- [ ] Seed or document a default System User login for testing (only `admin` + technicians exist today)

---

## Phase 5 — SMS & Job Complete Requests  ⬅️ next
**Goal:** technician completions land in a review queue; admin/system-user confirmation fires the Completion SMS and logs it; reminder cron runs on schedule.
- [x] `GET /api/jobs/complete-requests` — list jobs where `status='completed'` AND `admin_confirmed=FALSE` (with photo_count, comments, service type)
- [x] `PATCH /api/jobs/:id/confirm` — admin/system_user sets `admin_confirmed=TRUE`
- [x] "Completion Approvals" review screen (`/complete-requests`) — photo review, Approve button
- [x] **Completion SMS fires on confirm** (not on the technician's Complete tap) + logs to `sms_logs` — done 2026-07-28
  - Approving is now guarded on a real `FALSE→TRUE` transition, so a double-click can't text the customer twice; re-approving returns `sms:'already-approved'`.
  - Approval also now rejects a job that isn't `completed` (**422**) or doesn't exist (**404**) — previously it would flag any job.
  - SMS can never fail an approval: send + log are wrapped, and a customer with no phone is recorded as `skipped-no-phone` instead of being silently dropped. Approvals screen surfaces all of this in the success toast.
- [ ] Reminder cron (day-before visits) on schedule
  - `reminder` template also written and unused. Design is already settled (see phase-05 `plan.md`/`issues.md`): a **standalone `server/jobs/reminderCron.js`** invoked by a cPanel cron entry (`0 8 * * *`, absolute node + script paths) — **not** an in-process `node-cron`. File doesn't exist yet.
  - Three constraints from phase-05 `issues.md` to build in from the start: load `.env` explicitly (cron doesn't inherit app env); **guard against duplicate sends** (check `sms_logs` for an existing reminder for that job+date); and `pool.end()` / `process.exit(0)` so the script can't hang on the open DB pool. One failed message must not abort the batch.
- [ ] Flip `SMS_ENABLED=true` path verified against Text.lk (currently log-only)
  - `sendSms` posts to `app.text.lk/api/v3/sms/send` but has **never run live** — needs `TEXTLK_API_KEY` + `TEXTLK_SENDER_ID`.

## Phase 6 — Job Card Print / PDF
**Goal:** a job card can be opened, printed, and downloaded as a PDF cleanly.
- [ ] Job card view (print-friendly layout) — *nothing exists yet: no JobCard page, no `@media print` block in `styles.css`*
- [ ] Print stylesheet + Download-as-PDF

## Phase 7 — Archive & Renewal
**Goal:** cancelling archives an agreement (not deleted); renewing creates a fresh AS- linked to history, pre-filled from the old record.
- [ ] Agreement archive on cancel (distinct from job cancel/soft-delete) — *no archive/cancel endpoint for agreements exists (only jobs can be cancelled today)*
- [ ] Renew flow — new AS- linked via `parent_agreement_id`, pre-filled from prior record, loyalty year continuity
  - **Only the DB column exists.** `agreement.model` writes `parent_agreement_id` on insert but nothing ever passes a value (except `seed-demo`, which fakes a renewal chain). `findByNumber` is already documented as the Renew lookup — that's the read side, done.
- [ ] Confirm Deleted Jobs vs Job Cancellations remain distinct lists

## Phase 8 — Reporting
**Goal:** admin can see how many jobs each technician actually had confirmed-complete over a chosen period.
- [ ] Per-technician confirmed-completion counts over a date range — *nothing exists yet; no report route or page*
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
