# Phase 1 — Issues & Risks

| # | Issue | Likelihood | Mitigation |
|---|---|---|---|
| 1 | **No local MySQL** — `mysql` CLI not found on this dev machine. | High (confirmed) | Provide `schema.sql` that runs anywhere (local install, Docker, or directly in cPanel phpMyAdmin). Seed script uses `mysql2` from Node, so no CLI needed. Document the connection env vars clearly. |
| 2 | **`bcrypt` native build fails** on Windows / cPanel shared hosting (needs node-gyp + build tools). | Medium | Use **`bcryptjs`** (pure JS) — no native compilation. Drop-in API-compatible. |
| 3 | **JWT in React state is lost on page refresh** — user is logged out every reload. | High (by design) | Accepted for v1 per design plan. If the client dislikes it during UAT, switch to httpOnly secure cookie or (least preferred) localStorage. Flagged as an open decision. |
| 4 | **cPanel Passenger sets its own port** — hardcoding `app.listen(3000)` can conflict. | Medium | Read `process.env.PORT` with a sane local fallback; never hardcode. |
| 5 | **Admin lockout** — if no admin is seeded, no one can create users (chicken-and-egg). | Medium | `seed-admin.js` is idempotent and documented as the very first setup step. Credentials come from env, not hardcoded. |
| 6 | **utf8mb4 needed for Sinhala** in `route` field — plain `utf8` truncates. | Low | `schema.sql` creates the DB with `utf8mb4` / `utf8mb4_unicode_ci`; pool `charset` set to `utf8mb4`. |
| 7 | **CORS during local dev** — Vite dev server (5173) ≠ Express (3000). | Medium | Enable `cors` in dev; use a Vite proxy for `/api`. In production the same Express process serves both, so CORS is moot. |
| 8 | **Frontend route guards are not security** — a user could hit the API directly. | High (conceptual) | Real enforcement is backend JWT + `role.middleware`. Frontend guards are UX only; every protected route also checks the token server-side. |
| 9 | **Password hashing cost vs shared-hosting CPU** — high bcrypt rounds can be slow on cPanel. | Low | Use cost factor 10 (default) — fine for a low-login-volume internal tool. |
| 10 | **Secrets committed to git** — `.env` leaking `JWT_SECRET` / DB pass. | Medium | `.gitignore` excludes `.env`; only `.env.example` is committed. |

## Notes / observations
- MySQL CLI absent locally (confirmed via `mysql --version`). Backend code is DB-agnostic at boot — it only connects when a query runs — so the server can start and serve the frontend even before a DB is provisioned. Login will fail gracefully until the DB is reachable and seeded.
- Node v24 + npm 11 confirmed available on the dev machine. cPanel Node version should be pinned as close as possible during Phase 9.

## Getting a database WITHOUT installing MySQL locally
Confirmed on this machine: **Docker 27.4.0 installed**, WSL2 (Ubuntu 24.04) present, no local MySQL. You do **not** need a traditional MySQL install. Options, easiest first:

1. **Docker (recommended, already available)** — disposable MySQL 8 container, matches production version:
   ```bash
   docker run --name ac-mysql -e MYSQL_ROOT_PASSWORD=admin123 \
     -e MYSQL_DATABASE=ac_service_system -p 3306:3306 -d mysql:8
   ```
   Then in `server/.env`: `DB_USER=root`, `DB_PASS=admin123`, `DB_NAME=ac_service_system`, `DB_HOST=localhost`.
   Run `npm run db:init && npm run seed:admin && npm run dev`. Stop/remove with `docker stop ac-mysql && docker rm ac-mysql`.
2. **Free cloud MySQL** (Railway / Aiven / PlanetScale) — no local footprint; paste host/user/pass into `.env`. Reachable from anywhere.
3. **cPanel MySQL via Remote MySQL** (Phase 9+) — once hosting exists, whitelist your IP and point `.env` at it so dev + prod share one DB. Not worth setting up before the account is provisioned.

**Chosen for dev:** Option 1 (Docker). Traditional local install is explicitly NOT required.
