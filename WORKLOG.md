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

### Not yet verified (needs a running MySQL)
- Actual login with seeded admin, user creation, pricing upsert, and 403 for non-admin roles. All code paths are in place; run `npm run db:init && npm run seed:admin` against a MySQL instance to close this out.
- **DB without local install:** machine has **Docker 27.4.0** (no local MySQL needed). Recommended dev path — `docker run --name ac-mysql -e MYSQL_ROOT_PASSWORD=admin123 -e MYSQL_DATABASE=ac_service_system -p 3306:3306 -d mysql:8`, then set `.env` (root/admin123) and run the init+seed. Alternatives: free cloud MySQL (Railway/Aiven/PlanetScale) or cPanel Remote MySQL later. Full detail in [plans/phase-01-setup-db-auth/issues.md](plans/phase-01-setup-db-auth/issues.md#getting-a-database-without-installing-mysql-locally).

### Environment notes / decisions
- **No local MySQL** (`mysql` CLI absent) — use `npm run db:init` (Node-based) against cPanel/local/Docker MySQL. Server boots without a DB; DB-backed calls fail until connected.
- **Node v24.4.0 / npm 11.4.2** confirmed.
- **Vite outputs `dist/`**; `app.js` static path set to `client/dist` (design docs said `build/` — reconciled here; noted in `plans/phase-09-deployment/issues.md`).
- **`bcryptjs`** over native `bcrypt` (no node-gyp on Windows/cPanel).
- **JWT in React state only** (memory) per design — lost on refresh; accepted for v1.
- **`pricing.service_type`** given a UNIQUE constraint to support the `ON DUPLICATE KEY UPDATE` upsert.

### Next steps (Phase 2)
Customer & agreement registration, AS- numbering, job scheduler, activation SMS — see [plans/phase-02-customer-agreement/plan.md](plans/phase-02-customer-agreement/plan.md).
