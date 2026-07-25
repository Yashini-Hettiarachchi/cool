# Work Log — Highcool AC Service Management System

A running history of what was done, session by session. Newest entries at the top.

---

## 2026-07-22

### Summary
Read the full design documentation set, set up the phased build-tracking structure (`plans/`), and **built Phase 1 end-to-end** — backend API + React client for project setup, DB schema, authentication, and Admin user/pricing management.

### Done — Documentation & tracking
- **Reviewed all design docs** in [design-plans/](docs/design-plans/):
  - `01_Conversation_Summary`, `02_System_Functions_And_Workflows`, `03_System_Architecture`, `04_Folder_Structure`, `05_Overall_Design_Plan`, `06_Database_Design`, `07_Database_Setup_Guide_MySQL`, `08_Implementation_Plan_Step_By_Step`, `10_Tech_Stack`.
  - Confirmed stack: React + Node/Express + MySQL, deployed to cPanel, SMS via Text.lk, whole app mounted under `/admin`.
- **Created `plans/` folder** ([plans/](docs/plans/)) — status-tracking [README.md](docs/plans/README.md) + one folder per phase (1–10), each with `plan.md` (tasks + checkpoint) and `issues.md` (risks + mitigations).
- **Root [.gitignore](.gitignore)** and **[README.md](README.md)** (setup instructions).

### Done — Phase 1 build ✅
**Backend** ([server/](server/)):
- `package.json` + deps (express, mysql2, bcryptjs, jsonwebtoken, dotenv, cors, nodemon). Installed OK.
- `app.js` — Express: `/api/*`, static `/admin` (serves `client/dist`), SPA fallback, `/` → `/admin` redirect, health check, central error handler.
- `config/db.js` — mysql2 promise pool (utf8mb4, lazy connect).
- `db/schema.sql` (9 tables), `db/init-db.js` (runs schema from Node — no CLI needed), `db/seed-admin.js` (idempotent admin seed).
- Models: `user.model.js`, `pricing.model.js`.
- Auth: `auth.controller.js` (login → JWT `{id,role}`, `/me`), `auth.middleware.js`, `role.middleware.js` (`adminOnly`).
- Admin-only: `users.controller.js`/`routes` (CRUD + deactivate), `pricing.controller.js`/`routes` (get/upsert).

**Frontend** ([client/](client/)) — React + Vite:
- `vite.config.js` (`base:/admin/`, dev proxy `/api`→:3000), auth context (JWT in memory), fetch wrapper + api layer, `ProtectedRoute`, router (`basename="/admin"`).
- Screens: `Login`, `Dashboard` (placeholder), `AddUsers`, `AddPrice`, technician `TechHome` (placeholder), `styles.css`.

### Verified
- Backend boots on `PORT`; `/api/health` → `{ok:true, db:false}` (no local MySQL).
- `/api/users` without token → **401**; unknown `/api/*` → **404**; login without DB → 500 (expected — `ECONNREFUSED :3306`; logic correct, just no DB).
- `npm run build` (client) succeeds → `client/dist`.
- Express serves `/admin/` (HTML), `/` → 302 `/admin`, `/admin/dashboard` deep link → 200 (SPA fallback).

### DB-backed verification ✅ (completed)
Stood up a local DB via **Docker Compose** (no local MySQL install — machine has Docker 27.4.0). Created [docker-compose.yml](docker-compose.yml) with project name `ac-service-hub` grouping two services:
- **`ac-mysql`** (mysql:8, port 3306, persistent named volume `ac-mysql-data`, healthcheck)
- **`ac-adminer`** (adminer, port 8080 — browser DB viewer at http://localhost:8080)

Ran `npm run db:init` (9 tables created) + `npm run seed:admin` (admin id=1), then exercised the live API:
- Admin login → JWT issued ✓
- Create technician (Kamal Perera, id=2) ✓
- Set pricing: normal=3500, hp=5000 ✓
- List users returns admin + technician ✓
- Technician token → `GET /api/users` = **403**, `PUT /api/pricing` = **403** ✓

**Phase 1 checkpoint fully closed.**

**Data viewer:** Adminer at http://localhost:8080 → System: MySQL, Server: `ac-mysql` (or `localhost`), User: `root`, Pass: `admin123`, DB: `ac_service_system`.
**Stack control:** `docker compose up -d` / `docker compose down` (keeps data) / `docker compose down -v` (wipes DB).
**Note:** `server/.env` `DB_PASS` set to `admin123` to match the container root password.

### DB options recap (no local install needed)
1. **Docker Compose (chosen)** — `docker compose up -d` from repo root.
2. Free cloud MySQL (Railway/Aiven/PlanetScale) — paste creds into `.env`.
3. cPanel Remote MySQL (Phase 9+). Full detail in [plans/phase-01-setup-db-auth/issues.md](docs/plans/phase-01-setup-db-auth/issues.md#getting-a-database-without-installing-mysql-locally).

### Environment notes / decisions
- **No local MySQL** (`mysql` CLI absent) — use `npm run db:init` (Node-based) against cPanel/local/Docker MySQL. Server boots without a DB; DB-backed calls fail until connected.
- **Node v24.4.0 / npm 11.4.2** confirmed.
- **Vite outputs `dist/`**; `app.js` static path set to `client/dist` (design docs said `build/` — reconciled here; noted in `plans/phase-09-deployment/issues.md`).
- **`bcryptjs`** over native `bcrypt` (no node-gyp on Windows/cPanel).
- **JWT in React state only** (memory) per design — lost on refresh; accepted for v1.
- **`pricing.service_type`** given a UNIQUE constraint to support the `ON DUPLICATE KEY UPDATE` upsert.

### Change request — login by username (client requirement)
Client clarified login must use **username + password**, not phone. Applied end-to-end:
- Added `username VARCHAR(100) NOT NULL UNIQUE` to `users` (schema.sql + live `ALTER TABLE` migration; backfilled admin→`admin`, technician→`kamal`).
- Backend: `user.model` (`findByUsername`, create/update handle username), `auth.controller` (login by username), `seed-admin` (seeds username, `SEED_ADMIN_USERNAME=admin`), `users.controller` (username required + uniqueness check). Phone kept as optional contact field.
- Frontend: `Login` (Username field), `AddUsers` (username input + table column), `auth.api`/`AuthContext` send `username`.
- Verified: `admin`/`admin123` → 200; phone-based login → 400. Client rebuilt, server restarted.
- **New default login: username `admin`, password `admin123`.**

### Phase 2 build ✅ (Customer & Agreement Registration)
**Backend:**
- Services: `numberingService` (AS- serial, `FOR UPDATE` lock inside txn), `schedulerService` (generates `normal+hp` jobs spaced `period_days` apart), `smsService` (Text.lk wrapper + templates, **log-only** until `SMS_ENABLED=true`; never throws into the create flow).
- Models: `customer` (search by NIC/phone/name/AS-, full profile with AC units + agreements + loyalty years), `acUnit`, `agreement` (create, `findByNumber`, jobs).
- Controllers/routes: `customers` (`GET /search`, `GET /:id`, `POST /`), `agreements` (`GET /:number`, `POST /`). Both guarded `admin`+`system_user`.
- **`POST /api/agreements`** does it all in ONE transaction: reuse/create customer → create AC → generate AS- → insert agreement (1-yr) → auto-generate jobs → log activation SMS after commit. Wired into `app.js`.

**Frontend:** `customers.api` + `agreements.api`; screens `CustomerSearch`, `CustomerProfile` (agreements + AC units + "New agreement for this customer"), `NewAgreement` (customer/AC/agreement form, period presets 30/60/90/120, pricing prefill hints, success view listing generated visits). Routes + nav links added.

**Verified end-to-end:** created **AS-00001** for a new customer (2 Normal + 2 H/P, 90-day period) → **4 jobs** auto-scheduled (Oct 20 → Jan 18 → Apr 18 → Jul 17), end_date +1yr, activation SMS logged. Search by NIC and by AS- both resolve; profile returns correct counts; AS- lookup returns agreement + 4 jobs. Client build OK.

**Note:** Sinhala `route` showed `??????` in curl tests — a Windows-terminal arg-encoding artifact, not a DB issue (DB + pool are utf8mb4). Confirm with real browser input.

### Phase 3 build ✅ (Calendar, Assignment, Postpone/Cancel/Soft-delete)
**Backend:** `job.model` (month/day queries with customer+AC+technician joins, detail w/ photo count, assign, postpone, cancel, softDelete, addComment, listDeleted, listCancelled, listTechnicians) + `jobs.controller` + `jobs.routes` (guarded admin+system_user; static paths ordered before `/:id`). Wired into `app.js`. Two distinct removal concepts enforced: `cancel` (status+reason → Cancellations) vs `softDelete` (is_deleted → Deleted Jobs); never hard-deletes.
**Frontend:** `jobs.api` (+ added `patch` to the fetch client); screens `Calendar` (color-coded month grid, prev/next nav, status legend/counts, click a job → detail), `JobSlot` (full detail + assign / postpone / cancel / soft-delete / comment actions), `DeletedJobs`, `JobCancellations`. Routes + nav links + calendar/badge CSS added.
**Verified end-to-end:** calendar month query, technicians list, assign→Kamal, postpone (2027-01-18→01-23, status postponed), cancel (reason), soft-delete (is_deleted=1); Cancellations view=1, Deleted view=1. Client build OK.

### Frontend redesign — "Cool Ops" (sidebar + motion + brand)
Client-requested UI overhaul. Brand color **`#EA2046`** (crimson). Replaced the top navbar with a **dark rail sidebar**.
- **Design system:** rewrote `styles.css` (tokens, 21st/shadcn-idiom components — soft shadows, rounded surfaces, focus rings); fonts `Space Grotesk` (display) + `Inter` (UI) + `JetBrains Mono` (AS- IDs) via Google Fonts in `index.html`.
- **Shell:** `components/Sidebar.jsx` (role-aware grouped nav — Operations/Scheduling/Administration for office, minimal rail for technicians; inline SVG icons; red active indicator bar; user footer + sign-out) and `components/Layout.jsx` (sticky topbar with page title derived from route + mobile hamburger + drawer scrim).
- **Motion:** installed `motion` (v12); `lib/motion.js` tokens/variants; route cross-fades (`AnimatePresence`), staggered dashboard cards, button hover/tap, animated mobile drawer; `prefers-reduced-motion` respected.
- **Screens:** redesigned `Login` (split hero + form) and `Dashboard` (welcome hero + animated quick-action cards). All other pages inherit the new look via the global stylesheet.
- **App.jsx** restructured: unauthenticated → Login; authenticated → `<Layout>` + `<AnimatedRoutes>`.
- Build OK (460 modules); server serves new build under `/admin`.
- **Note:** 21st.dev Magic MCP was installed mid-session but its tools don't load until Claude Code restarts (and it needs an API key) — redesign done by hand in the 21st idiom; can pull live 21st components once the MCP is active.

### Redesign polish (calendar fit + global interactivity)
- **Calendar** now fits the viewport exactly (fixed-height flex card, `grid-auto-rows:1fr` so rows divide leftover height — no page scroll on 5- or 6-row months). Added today ring, "Today" jump, weekend/out-of-month hatching, per-day count, tinted status job-chips, count-pill legend, floating empty-state overlay, month-change + hover motion.
- **Global button system** (primary/secondary/ghost/danger) with hover lift + branded glow, press states, and keyboard `:focus-visible` rings on all interactive elements. Ghost/link actions (View/Edit/Deactivate) are now tinted pills that clearly read as clickable. Inputs: hover border, disabled = dashed/muted, refined scrollbars. All in `client/src/styles.css` — applies app-wide.

### Dashboard + Calendar upgrade (ref-inspired layouts)
Adapted two reference calendar layouts (side-panel pattern) to our light/brand theme.
- **Backend:** `JobModel.overview()` (dashboard counts: customers, active agreements, upcoming, completed-this-month, pending approvals) + `JobModel.upcoming(limit)`; exposed as `GET /api/jobs/stats` and `GET /api/jobs/upcoming` (guarded office roles; static routes ordered before `/:id`).
- **Dashboard:** live **stat-tile row** (5 tiles, tinted icons), 2×2 **quick actions** (fixed the button `white-space:nowrap` that was truncating card text), and an **Upcoming Visits** list (date chip + customer + AS- + route). Motion stagger.
- **Calendar:** now a **two-column layout** — month grid + a **side panel** (Today card with big date + today's visit count, Upcoming list, Status legend with live counts). Whole area still locked to the viewport (`.cal-layout` height calc; grid rows `1fr`); collapses to single column under 960px.
- Verified: stats endpoint returns live counts; build OK; served under /admin.

### Job Detail redesign (interactive, readable blocks + tidy actions)
Client feedback: the Job Detail blocks weren't visually distinct and the action buttons were an undifferentiated stack. Rebuilt [JobSlot.jsx](client/src/pages/admin/JobSlot.jsx):
- **Info tiles** — each field (Customer, Phone, Route, Address, AC, Scheduled, Technician, Photos, Postponed-from) is now its own bordered tile with a tinted icon, uppercase label + bold value; unassigned technician renders dimmed/italic. Staggered fade-in on mount + subtle hover lift. Reads as separate, scannable blocks instead of a bare grid.
- **Grouped actions** — Assign / Postpone / Comment / Cancel are each a titled card (icon + title + one-line description) in a 2-col grid; Cancel uses a warm "warn" tone. Buttons show inline busy states ("Assigning…", "Postponing…", etc.) and disable while a request is in flight.
- **Danger zone** — soft-delete moved into a clearly separated tinted panel with an explanation, away from the routine actions.
- **Motion/a11y** — `motion/react` stagger + tap feedback, `AnimatePresence` on the notice/error alert; respects `prefers-reduced-motion` via the global media rule. New CSS in `styles.css` (`.info-grid/.info-tile`, `.action-groups/.action-group`, `.danger-zone`); responsive collapse to 2-col then 1-col. `.detail-grid`/`.action-row` kept (still used by CustomerProfile). Build OK (460 modules).

### Site-wide page redesign (ui-ux-pro-max pass)
Applied the Job Detail treatment across the whole admin surface for one consistent, interactive language. Added reusable primitives in [components/ui.jsx](client/src/components/ui.jsx): `PageHeader` (icon + title + subtitle + actions), `EmptyState` (icon + message + optional CTA), `Avatar` (deterministic initials tint), `Pill`/soft status badges, a single Lucide-style icon set, and row-stagger motion variants. New CSS in `styles.css` (`.page-head`, `.empty-state`, `.avatar`, `.pill`, `.badge-soft`, `.price-card`, `.search-input`, responsive rules).
- **CustomerProfile** — replaced the bare `.detail-grid` (same "blocks not separable" issue) with the info-tile pattern; avatar + loyalty chip hero, soft status badges on agreements, AS- mono chips, per-section empty states, motion.
- **CustomerSearch** — icon page header, search field with inline icon, initial "find a customer" state, no-match empty state with CTA, avatar rows, clickable rows, staggered entrance.
- **AddUsers** — page header, avatar name cells, role + status **pills** (replacing plain text), busy state on submit, empty state, row stagger.
- **AddPrice** — plain inputs → two **price cards** (icon, current value, Rs-prefixed input, dirty-aware Save/Saved), animated alerts.
- **DeletedJobs / JobCancellations** — icon page headers, soft status badges, AS- chips, proper empty states, motion.
- **TechHome** — Phase-4 placeholder made intentional: hero + "coming in Phase 4" info tiles.
All motion is transform/opacity only and respects `prefers-reduced-motion`. Build OK (461 modules). Dashboard/Calendar/Login/JobSlot/NewAgreement already carried the language from earlier passes.

### New Agreement forms + Dashboard restack + fixes
- **New Agreement** — rebuilt as a guided 3-step form: intro card with a numbered **stepper** (Customer → AC Unit → Service Plan), icon-prefixed fields (`IconField`), and −/+ **number steppers** for visit counts. Period is a segmented control with `days` + friendly label (Monthly/Bi-monthly/Quarterly/4-monthly). Non-emoji calendar note summarises what will be scheduled; submit disabled until at least one visit is added. `required` now flows through `IconField` to the input (native validation + asterisk).
- **Dashboard** — stat tiles are now clickable (navigate to their section, hover lift, `→` affordance); the scattered side-by-side lower section was restacked into titled blocks — "Quick actions" grid then a full-width **Upcoming Visits** card with defined, separable row chips.
- **Calendar** — month prev/next arrows replaced with proper `Chevron` SVG buttons; side "Upcoming" items given borders/spacing so they read as separate rows.
- **Users** — fixed the Deactivate button rendering as a solid red block with invisible text (CSS specificity: `button.link.danger` now forces transparent background).
- **Block separation (site-wide)** — strengthened `.card` border + shadow and converted transparent-at-rest list rows into bordered chips, addressing the recurring "everything blended together" feedback.
- **Crash fix** — New Agreement went blank because `icon="customer"` had no entry in the shared `ICONS` set, so `Svg` ran `undefined.split('M')`. Added the `customer` icon and hardened `Svg` with `(d || '')` so a missing/typo'd key can never crash a page again.
- Cleaned a duplicate `required` JSX attribute warning. Build OK (461 modules, no warnings).

### Phase 4 build ✅ (Technician Mobile Module)
A technician can now log in on a phone, see today's assigned jobs, search any job by AS-, start it, upload photos, tag the service type, and complete it into the approval queue.

**Backend** — extended the existing `/api/jobs` router (technicians are now allowed on their own jobs):
- `GET /jobs/mine/today` (assigned + today, route order), `GET /jobs/by-agreement/:as_number` (all visits under an AS-).
- `PATCH /jobs/:id/status` — `in_progress` / `completed`; completing requires `service_type_used` (normal|hp), stamps `completed_at`, leaves `admin_confirmed=FALSE` (→ approval queue).
- `POST /jobs/:id/photos` (multer, field `photos`) — **max 5**, 5MB each, image-only; rolls back just-written files if the cap is exceeded. `GET /jobs/:id/photos` + `GET /jobs/:id/photos/:photoId` — authenticated list + file **stream** (not public static).
- **Ownership guard** (`ownsJob`): a technician may only read/act on jobs where `technician_id = req.user.id`; office roles (admin/system_user) bypass. Per-route role guards replaced the blanket office-only `router.use`. `comment` opened to the assigned technician too.
- New `job.model` methods (`myTodayJobs`, `listByAgreementNo`, `isOwnedBy`, `updateStatus`, `countPhotos`, `addPhoto`, `listPhotos`, `getPhoto`) and `config/upload.js` (disk storage, collision-safe filenames). Installed `multer`.

**Frontend** — `client/src/pages/technician/`:
- `TodayJobs.jsx` (replaces the `TechHome` placeholder at `/technician`) — today's assigned jobs as large tappable cards + a "Search a job" button.
- `JobSearch.jsx` (`/technician/search`) — AS- lookup returning the agreement's visit list.
- `JobDetail.jsx` (`/technician/jobs/:id`) — info tiles, **Start**, photo grid with `<input type="file" accept="image/*" capture="environment" multiple>` (authenticated blob-URL thumbnails, n/5 counter), Normal/H-P segmented selector, comment, sticky **Complete** bar; a "Completed → awaiting approval" banner once done.
- `technician.api.js` + `postForm` (multipart) and authenticated `photoUrl` blob fetch on the client (JWT is in memory, so `<img src>` can't carry the header). Shared `TechJobCard`. Routes + role-aware catch-all redirect in `App.jsx`; Sidebar gains a "Find Job" item. Mobile-first CSS block (single-column, ≥44px targets, photo grid, sticky action bar).

**Decision (client):** dropped the hard **min-4** completion gate — just upload photos; max 5 kept as a safety cap. Complete requires only a service-type choice.

**Verified end-to-end** (live Docker DB, test server on :3100): admin created a technician + assigned a job → technician login → today list, AS- search, detail, start (`in_progress`), upload 2 photos (201), authenticated photo retrieval (200 image/png), unauthenticated blocked (401), max-5 cap (422 + file rollback verified: exactly 2 files on disk), ownership 403 on an unassigned job, completion blocked without service type (422) then succeeded → `pendingApprovals=1`. Client build OK (465 modules).

**Deployed to the running dev server:** the stale :3000 node process (pre–Phase 4 code) was killed and the server restarted via `npm run dev` (nodemon, auto-reload) so `/admin` now serves the Phase 4 build. Test login for the technician surface: **`testtech` / `tech123`**. Note this run left sample data in the dev DB (technician `testtech`; AS-00001 visit #1 completed with 2 photos, awaiting approval) — delete it for a clean slate.

### Post–Phase 4 tweaks (client feedback, 2026-07-24)
- **Consolidated docs** — moved `design-plans/`, `plans/`, `wireframes/` under a single root **`docs/`** folder; fixed the links in `README.md`/`WORKLOG.md` (in-folder links still resolve). (`.gitignore` `docs/` entry was added then removed by the client — docs are tracked.)
- **Customers page lists everyone by default** — new `GET /api/customers` (`CustomerModel.listAll`, with per-customer `agreement_count`); the page loads all customers on open, search still filters (incl. AS-), added a "Show all" reset, an Agreements count column, and a live header count.
- **New Assignments board** (`/assignments`, Scheduling nav) so the office isn't hunting the calendar to assign — `GET /api/jobs/to-assign` (upcoming `scheduled`/`postponed`, not deleted) → `Assignments.jsx` with an **Unassigned / All** filter and an **inline technician dropdown** (assign in place, reuses `PATCH /jobs/:id/assign`). Verified: endpoint returns upcoming active visits; build OK (466 modules).
- **Test-data note:** set AS-00001 visit 4 to today/`scheduled`/`testtech` so the technician photo-upload flow is visible (it's hidden on completed jobs). Login `testtech` / `tech123`.
- **Demo data seeder** — `server/db/seed-demo.js` (`npm run seed:demo`), idempotent (keys off phones `07999*`, wipes only its own set, continues AS- serial). 5 customers → 7 agreements, 21 jobs covering every scenario: (1) fresh/all-unassigned, (2) assigned + in-progress today, (3) completed-awaiting-approval, (4) confirmed-complete-this-month + postponed, (5) 3-yr loyalty customer with 2 ACs, a renewal chain (`parent_agreement_id`), an archived (cancelled) agreement, a cancelled job (Cancellations) and a soft-deleted job (Deleted Jobs). Photo rows are placeholders (counts populate; thumbnails 404).

### UI pass + Completion Approvals (client feedback, 2026-07-24)
- **Reusable pagination** — `components/Pagination.jsx` (+ `paginate()` helper) applied to Customers (15/pg), Assignments (12), Cancellations (12), Deleted Jobs (12), Users (12), and Dashboard Upcoming (5). Numbered pages with ellipsis windowing, chevron prev/next, range label, page-reset on search/filter.
- **Buttons** — replaced all tiny text arrows (`→`/`←`) with crisp SVG chevrons across pagination, dashboard tiles, pill-links, row "view", and back links; consistent hover/focus.
- **Layout fix** — `.content` was `max-width:1100px` with no auto-margin (content pinned to one side, dead space). Now `max-width:1320px; margin:0 auto` — centered/balanced app-wide.
- **Dashboard redesigned** — light time-of-day greeting (replaced the heavy dark hero), cleaner KPI tiles reordered so **Pending Approvals leads** (red "attention" ring when >0), and a **2-column** layout (Upcoming Visits + compact Quick actions) to cut vertical scroll.
- **Bug fixes** — job detail pages went blank (`/jobs/:id`) because a back-link referenced a missing local icon key → crash; fixed + hardened JobSlot's `Svg`. Assignments header showed an empty box (shared icon set had no `jobs` key) → added it.
- **Completion Approvals (Phase 5 core) ✅** — technician completions now have a review+approve home:
  - Backend: `GET /api/jobs/complete-requests` (completed + `admin_confirmed=FALSE`, with `photo_count`), `PATCH /api/jobs/:id/confirm` (office-only → sets `admin_confirmed=TRUE`). Photo file endpoint already admin-readable (ownsJob bypass for office).
  - Frontend: **Approvals** screen (`/complete-requests`, Scheduling nav) — one card per pending completion showing customer, AC, technician, service type, comment, and the **uploaded photos** (authenticated blob thumbnails, click to open full size) + **Approve** button. Dashboard "Pending Approvals" tile links here.
  - Technician can now **see their own uploaded photos** after completing (the completed view previously hid them).
  - Verified: `GET /jobs/complete-requests` returns pending completions with photo counts; build OK.
  - **Sidebar badge** — live pending-approvals count on the Approvals nav item (initial fetch + 60s poll + instant refresh via an `approvals-changed` window event on approve; office roles only).
  - **Photo lightbox** — reusable `components/Lightbox.jsx`; approval photos open as an in-window popup (prev/next, Esc/←/→, counter) instead of a new browser tab.
  - **Pending / Approved tabs** — Approvals screen now filters between the pending queue and already-approved history (`GET /jobs/complete-requests?status=approved`; `JobModel.listCompletions(confirmed)`). Approved cards show an "Approved" pill, no Approve button.
- **Installed Vercel skills** into `~/.claude/skills`: web-design-guidelines, react-best-practices, composition-patterns, writing-guidelines.
- **Still TODO for Phase 5:** confirmation should fire the Completion SMS (Text.lk) + log to `sms_logs`; reminder cron.

### Approvals refinements (client feedback, 2026-07-24)
- **Sidebar notification badge** — the "Approvals" nav item shows a live count of pending completions so the office doesn't have to keep opening the page. `Sidebar.jsx` polls `GET /api/jobs/stats` (`pendingApprovals`) on a light interval and also refreshes instantly when an approval happens on the page (custom `approvals-changed` window event). Office roles only; `.nav-badge` styling added.
- **In-window photo lightbox** — approval photos now open in a `components/Lightbox.jsx` popup (backdrop, prev/next arrows + keyboard ←/→, Esc/click-out to close) instead of opening a new browser tab. Wired into the Approvals photo grid.
- **Approved-jobs history** — Approvals screen gained **Pending / Approved** tabs. Backend generalised: `JobModel.listCompletions(confirmed)` + `GET /api/jobs/complete-requests?status=approved` returns already-confirmed completions (photo_count included); pending is the default. Verified both filters respond correctly; build OK.

### Next steps (Phase 5 remainder)
Job completion approval workflow (admin confirms queued completions → finalize + loyalty/SMS) and renewals — see [plans/](docs/plans/).
