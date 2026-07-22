# Phase 9 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **Passenger startup file & port** — cPanel expects a specific entry (`app.js`) and injects `PORT`. | Startup file = `server/app.js`; read `process.env.PORT`; don't hardcode. Verify app root matches repo layout. |
| 2 | **Vite build output is `dist/`, not `build/`** (design docs say `build/`). | Reconcile: either configure Vite `build.outDir='build'` or update Express static path to `dist`. Decide once, document. |
| 3 | **`node_modules` / native deps** on shared hosting. | Use pure-JS deps (bcryptjs). Run cPanel "NPM Install" on the server, don't upload local `node_modules`. |
| 4 | **Uploads dir persistence** across deploys. | Keep `server/uploads/job_photos` outside the git-synced tree or ensure deploys don't wipe it; create on boot. |
| 5 | **Env vars in two places** (`.env` vs cPanel UI). | On cPanel, prefer the Node.js App env UI; ensure the app reads both gracefully. |
| 6 | **Cron env** — cron doesn't inherit app env. | Load `.env` explicitly inside `reminderCron.js`; use absolute node + script paths. |
| 7 | **SPA deep links** (`/admin/dashboard`) 404 on refresh. | Express catch-all `app.get('/admin/*', ...)` serves `index.html`; React Router `basename="/admin"`. |
