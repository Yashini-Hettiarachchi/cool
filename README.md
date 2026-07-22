# Highcool Service Hub — AC Service Management System

Web-based system for an AC servicing company: 1-year service agreements, automated SMS, technician scheduling with photo proof, renewals, reporting. React + Node/Express + MySQL, deployed to cPanel. The whole app is mounted under `/admin` (root reserved for a future showcase site).

- **Design docs:** [`design-plans/`](design-plans/)
- **Phased build plan & issues log:** [`plans/`](plans/)
- **Work history:** [`WORKLOG.md`](WORKLOG.md)

## Repository layout

```
AC-Project/
├── server/          # Node.js + Express API (mysql2)
├── client/          # React (Vite) — builds to client/dist, served under /admin
├── design-plans/    # Source design documentation
├── plans/           # Per-phase build plan + anticipated issues
└── WORKLOG.md       # Running session-by-session history
```

## Prerequisites
- Node.js ≥ 18 (developed on v24)
- MySQL 8.x (local, Docker, or cPanel)

## Local setup

### 1. Backend
```bash
cd server
npm install
cp .env.example .env          # then edit DB creds + JWT_SECRET
npm run db:init               # creates DB + 9 tables from db/schema.sql
npm run seed:admin            # seeds the first admin (creds from .env)
npm run dev                   # http://localhost:3000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev                   # http://localhost:5173/admin (proxies /api to :3000)
```
For a production-style run, `npm run build` in `client/`, then the Express server serves `client/dist` at `http://localhost:3000/admin`.

## Default login (after seeding)
- **Phone:** value of `SEED_ADMIN_PHONE` (default `0770000000`)
- **Password:** value of `SEED_ADMIN_PASSWORD` (default `admin123`) — change after first login.

## Status
**Phase 1 complete** — project setup, DB schema, authentication, Admin user & pricing management. See [`plans/README.md`](plans/README.md) for the full phase roadmap.
