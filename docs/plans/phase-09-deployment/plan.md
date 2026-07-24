# Phase 9 — Deployment to cPanel

**Goal:** Full app live and functional on the temporary hosting URL.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 9).

## Tasks
- [ ] Setup Node.js App in cPanel (Node version, app root, startup file `app.js`)
- [ ] Create MySQL DB + user via cPanel MySQL Databases; run `schema.sql`; run `seed-admin.js`
- [ ] Set env vars in Node.js App UI (DB creds, JWT secret, Text.lk API key)
- [ ] Push via cPanel Git (or SFTP) → Run NPM Install → Restart
- [ ] Build React locally (`npm run build`) → upload `client/dist` (Vite) to the served path; wire Express static
- [ ] Set up daily cron for `reminderCron.js`
- [ ] Test via cPanel temporary URL (domain not purchased yet)

## Checkpoint
App live and functional on the temporary hosting URL.
