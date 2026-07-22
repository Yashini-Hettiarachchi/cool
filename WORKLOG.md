# Work Log — Highcool AC Service Management System

A running history of what was done, session by session. Newest entries at the top.

---

## 2026-07-22

### Summary
Read the full design documentation set, set up the phased build-tracking structure (`plans/`), and began scaffolding the Phase 1 project skeleton.

### Done
- **Reviewed all design docs** in [design-plans/](design-plans/):
  - `01_Conversation_Summary`, `02_System_Functions_And_Workflows`, `03_System_Architecture`, `04_Folder_Structure`, `05_Overall_Design_Plan`, `06_Database_Design`, `07_Database_Setup_Guide_MySQL`, `08_Implementation_Plan_Step_By_Step`, `10_Tech_Stack`.
  - Confirmed stack: React + Node/Express + MySQL, deployed to cPanel, SMS via Text.lk, whole app mounted under `/admin`.
- **Created `plans/` folder** ([plans/](plans/)) with a status-tracking [README.md](plans/README.md) and one folder per phase (1–10), each containing:
  - `plan.md` — concrete tasks + checkpoint (definition of done)
  - `issues.md` — anticipated risks + mitigations
- **Created root [.gitignore](.gitignore)** — ignores `node_modules`, `.env`, build output, and uploaded technician photos.

### In progress
- **Phase 1 — Project Setup, DB Schema, Authentication** (see [plans/phase-01-setup-db-auth/plan.md](plans/phase-01-setup-db-auth/plan.md)).
  - Backend scaffold not yet started (next step).

### Next steps (queued)
1. Scaffold backend: `server/package.json`, deps (`express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`), `app.js`, `config/db.js`, `.env.example`.
2. `server/db/schema.sql` (9 tables) + `server/db/seed-admin.js`.
3. `user.model.js` + `pricing.model.js`.
4. Auth (login + JWT), `auth.middleware.js`, `role.middleware.js`.
5. Users + pricing routes/controllers (Admin-only).
6. React client (Vite): auth context, API layer, `Login` / `AddUsers` / `AddPrice`.
7. Verify backend boots + client builds → close Phase 1 checkpoint.

### Environment notes / decisions
- **No local MySQL** on this machine (`mysql` CLI not found) — schema will run in cPanel/phpMyAdmin or a local install; server boots without a DB (login fails until one is connected).
- **Node v24.4.0 / npm 11.4.2** confirmed available.
- **Vite outputs `dist/`** but design docs reference `build/` — to be reconciled in Phase 9 (flagged in `plans/phase-09-deployment/issues.md`).
- **`bcryptjs`** chosen over native `bcrypt` (avoids node-gyp build issues on Windows + cPanel).
- **JWT held in React state only** (memory) per design — lost on refresh; accepted for v1.
