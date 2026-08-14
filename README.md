# Highcool Service Hub — AC Service Management System

Web-based system for an AC servicing company: 1-year service agreements, automated SMS, technician scheduling with photo proof, renewals, reporting. React + Node/Express + MySQL, deployed to cPanel. The whole app is mounted under `/admin` (root reserved for a future showcase site).

- **Design docs:** [`design-plans/`](docs/design-plans/)
- **Phased build plan & issues log:** [`plans/`](docs/plans/)
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

## Local setup (Without Docker)

### 1. Setup & Environment
```bash
npm run setup                 # installs dependencies for server and client
cp server/.env.example server/.env # edit DB credentials (root / admin123 by default)
```

### 2. Database Initialisation
```bash
npm run db:init               # creates ac_service_system database & tables
npm run seed:admin            # seeds the first admin user
```

### 3. Run the App
- **Development mode (hot reload):**
  ```bash
  npm run dev                 # runs server (:3000) and client (:5173) concurrently
  ```
  Open **http://localhost:5173/admin**

- **Production-style mode:**
  ```bash
  npm run build               # builds client static files to client/dist
  npm start                   # starts Express server on http://localhost:3000/admin
  ```

## Default login (after seeding)
Login is by **username + password** (per client requirement; phone is contact info only).
- **Username:** value of `SEED_ADMIN_USERNAME` (default `admin`)
- **Password:** value of `SEED_ADMIN_PASSWORD` (default `admin123`) — change after first login.

## Status
**Phase 1 complete** — project setup, DB schema, authentication, Admin user & pricing management. See [`plans/README.md`](docs/plans/README.md) for the full phase roadmap.
