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

### Next steps (Phase 3)
Calendar, technician assignment, postpone/cancel/soft-delete, Deleted Jobs & Cancellations views — see [plans/phase-03-calendar-scheduling/plan.md](plans/phase-03-calendar-scheduling/plan.md).
