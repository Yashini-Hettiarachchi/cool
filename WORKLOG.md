# Work Log — Highcool AC Service Management System

A running history of what was done, session by session. Newest entries at the top.

---

## 2026-07-22

### Summary
Read the full design documentation set, set up the phased build-tracking structure (`plans/`), and **built Phase 1 end-to-end** — backend API + React client for project setup, DB schema, authentication, and Admin user/pricing management.

### Done — Documentation & tracking
- **Reviewed all design docs** in [design-plans/](design-plans/):
  - `01_Conversation_Summary`, `02_System_Functions_And_Workflows`, `03_System_Architecture`, `04_Folder_Structure`, `05_Overall_Design_Plan`, `06_Database_Design`, `07_Database_Setup_Guide_MySQL`, `08_Implementation_Plan_Step_By_Step`, `10_Tech_Stack`.
  - Confirmed stack: React + Node/Express + MySQL, deployed to cPanel, SMS via Text.lk, whole app mounted under `/admin`.
- **Created `plans/` folder** ([plans/](plans/)) — status-tracking [README.md](plans/README.md) + one folder per phase (1–10), each with `plan.md` (tasks + checkpoint) and `issues.md` (risks + mitigations).
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
3. cPanel Remote MySQL (Phase 9+). Full detail in [plans/phase-01-setup-db-auth/issues.md](plans/phase-01-setup-db-auth/issues.md#getting-a-database-without-installing-mysql-locally).

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

### Next steps (Phase 4)
Technician mobile module — AS- job search, start/complete, photo upload (min 4/max 5), Normal/H-P type tagging, completion into the approval queue — see [plans/phase-04-technician-mobile/plan.md](plans/phase-04-technician-mobile/plan.md).
