# How to Run — Highcool Service Hub

All commands are run from the project root: **`d:\Business\Projects\AC-Project`**

> **No Docker on your machine?** Docker only runs the database here, not the app.
> See **[SETUP-WITHOUT-DOCKER.md](AC-Project/SETUP-WITHOUT-DOCKER.md)** for a full
> from-scratch setup using a locally installed MySQL instead.

---

## 1. Start the database (Docker)

```bash
docker compose up -d
```

This starts two containers under the `ac-service-hub` project:
- `ac-mysql`  — MySQL 8 (port 3306, data persists in a named volume)
- `ac-adminer` — browser-based DB viewer (port 8080)

### First-time only — create tables + seed the admin login
```bash
cd server
npm install
npm run db:init      # creates the 10 tables from db/schema.sql
npm run seed:admin   # creates the admin user
```

---

## 2. Run the app — pick ONE mode

### Option A — Production-style (single URL, simplest)
```bash
cd client
npm install
npm run build
cd ../server
npm run dev
```
Open **http://localhost:3000/admin**

### Option B — Dev mode (hot reload while editing the UI) — two terminals
```bash
# Terminal 1 — backend
cd server
npm run dev
```
```bash
# Terminal 2 — frontend (hot reload)
cd client
npm run dev
```
Open **http://localhost:5173/admin**

---

## Login
Login is by **username + password** (phone is contact info only).
- **Username:** `admin`
- **Password:** `admin123`

---

## Quick reference

| Purpose | Command / URL |
|---|---|
| Start DB | `docker compose up -d` |
| Stop DB (keeps data) | `docker compose down` |
| Stop + WIPE DB | `docker compose down -v` (then re-run `db:init` + `seed:admin`) |
| Check DB status | `docker compose ps` |
| View data (Adminer) | http://localhost:8080 → System: MySQL · Server: `ac-mysql` · User: `root` · Pass: `admin123` · DB: `ac_service_system` |
| App (prod-style) | http://localhost:3000/admin |
| App (dev mode) | http://localhost:5173/admin |
| Reminder cron (dry run) | `cd server && npm run cron:reminders:dry` |

---

## TL;DR — just start it (DB already initialized before)

```bash
docker compose up -d
cd server
npm run dev
```
Then open **http://localhost:3000/admin**.

> Note: for prod-style mode, make sure you've run `npm run build` in `client/` at least once so there's a build for the server to serve. In dev mode this isn't needed.

---

## Reminder SMS (the daily cron)

The day-before reminder is **not** scheduled inside the app — Passenger recycles
the web process when it idles, so an in-process timer would quietly stop firing.
It is a standalone script the host runs once a day.

### Locally
```bash
cd server
npm run cron:reminders:dry     # show who WOULD be texted tomorrow, send nothing
npm run cron:reminders         # the real run
node jobs/reminderCron.js --date=2026-10-22   # a specific visit date
```

### On cPanel (Cron Jobs → Add New Cron Job)
Once a day at 08:00, with **absolute paths** — cron has no PATH and no working
directory of yours:
```
0 8 * * * /usr/bin/node /home/<cpanel-user>/ac-service-app/server/jobs/reminderCron.js >> /home/<cpanel-user>/logs/reminders.log 2>&1
```
Check `which node` over SSH first; on some cPanel hosts it is
`/opt/alt/alt-nodejs18/root/usr/bin/node` rather than `/usr/bin/node`.

The script reads `server/.env` by absolute path, skips anyone already reminded
that day, keeps going if one message fails, and closes the DB pool on exit.

Before 08:00 you can see the batch in the app: **SMS Centre → Reminders**.

---

## Turning live SMS on

Out of the box the system is in **log-only** mode: every message is rendered and
recorded in `sms_logs`, but nothing is delivered. To go live:

1. Put the Text.lk credentials in `server/.env`:
   ```
   SMS_ENABLED=true
   TEXTLK_API_KEY=<your key>
   TEXTLK_SENDER_ID=<your approved sender id>
   ```
2. Restart the server.
3. **SMS Centre → Templates → Send a test message** — send one to your own phone.
   A green result means Text.lk accepted it; a red one shows their error text
   (bad key, unapproved sender ID, no credit).

Message wording is editable from the same screen; edits are stored in the
`sms_templates` table and take effect immediately.

---

## Ports

| Service | Port |
|---|---|
| Backend API + served UI | 3000 |
| Frontend dev server (Vite) | 5173 |
| MySQL | 3306 |
| Adminer (DB viewer) | 8080 |
