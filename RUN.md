# How to Run — Highcool Service Hub

All commands are run from the project root: **`d:\Business\Projects\AC-Project`**

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
npm run db:init      # creates the 9 tables from db/schema.sql
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

## Ports

| Service | Port |
|---|---|
| Backend API + served UI | 3000 |
| Frontend dev server (Vite) | 5173 |
| MySQL | 3306 |
| Adminer (DB viewer) | 8080 |
