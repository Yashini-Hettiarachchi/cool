# Phase 1 — Project Setup, Database Schema, Authentication

**Goal:** A running skeleton where Admin, System User, and Technician can log in and get correctly role-restricted; Admin can manage users and default pricing.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 1).

---

## Tasks

### Backend scaffolding
- [x] `npm init` in `server/`, install `express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, and `nodemon` (dev)
- [x] `server/app.js` — Express entry point; mounts `/api`, serves React build under `/admin`, root redirects to `/admin`
- [x] `server/config/db.js` — mysql2 promise **pool**, reads DB creds from env
- [x] `.env.example` + `.env` with DB creds, `JWT_SECRET`, `PORT`

### Database
- [x] `server/db/schema.sql` — all 9 `CREATE TABLE` statements incl. 3-role `users` enum and `pricing` table (from `07_Database_Setup_Guide_MySQL.md`)
- [x] `server/db/seed-admin.js` — inserts one Admin (phone + bcrypt password) so first login is possible; idempotent

### Models
- [x] `server/models/user.model.js` — findByPhone, findById, list, create, update, deactivate
- [x] `server/models/pricing.model.js` — get all, upsert by service_type

### Auth & middleware
- [x] `server/controllers/auth.controller.js` — `POST /api/auth/login`: find user by phone, check `active`, `bcrypt.compare`, sign JWT `{ id, role }`
- [x] `server/middleware/auth.middleware.js` — verify `Authorization: Bearer <jwt>`, attach `req.user`
- [x] `server/middleware/role.middleware.js` — `requireRole(...roles)`; `adminOnly` guard for `/api/users/*` and `/api/pricing/*`
- [x] `server/routes/auth.routes.js`

### Admin: users & pricing
- [x] `server/controllers/users.controller.js` + `server/routes/users.routes.js` (Admin only) — list / create / update / deactivate system_user & technician accounts
- [x] `server/controllers/pricing.controller.js` + `server/routes/pricing.routes.js` (Admin only) — get / set default Normal & H-P prices

### Frontend (React + Vite)
- [x] `client/` scaffolded with Vite, React Router `basename="/admin"`
- [x] Auth context — JWT held in React state (**not** localStorage per design), attached to all API calls via an axios/fetch wrapper
- [x] `Login.jsx` — phone + password, calls `/api/auth/login`, routes by role
- [x] `AddUsers.jsx` (Admin only) — add/update/deactivate users
- [x] `AddPrice.jsx` (Admin only) — set default Normal / H-P price
- [x] `api/` layer: `auth.api.js`, `users.api.js`, `pricing.api.js`
- [x] Role-based route guard component (frontend UX; backend is the real enforcement)

---

## Checkpoint (definition of done)

Admin, System User, and Technician can all log in and get correctly routed/restricted by role; Admin can manage users and pricing. System User and Technician receive 403 on `/api/users/*` and `/api/pricing/*`.

## Verification steps
1. `cd server && npm install && node db/seed-admin.js` (against a local or cPanel MySQL) → admin row exists.
2. `npm run dev` → server boots on `PORT`, `/api/health` returns ok.
3. `POST /api/auth/login` with seeded admin → returns JWT + role.
4. With admin JWT: create a system_user and a technician via `/api/users`; set prices via `/api/pricing`.
5. Log in as the created technician → `/api/users` and `/api/pricing` return **403**.
6. `cd client && npm install && npm run build` → build succeeds.

## Decisions locked in this phase
- **`bcryptjs`** (pure JS) instead of `bcrypt` (native) — avoids node-gyp/build-tool pain on Windows dev + cPanel shared hosting.
- **`mysql2` promise pool** (not Sequelize) — matches the raw-SQL style in the design docs; lighter footprint.
- JWT stored in **React state only** (memory) per the design plan — lost on refresh (acceptable for v1; revisit with httpOnly cookie if the client wants persistence).
- AS- number format kept as `AS-00001` (open item flagged in `05_Overall_Design_Plan.md`).
