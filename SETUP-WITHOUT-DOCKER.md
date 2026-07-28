# Setup Guide — Running Without Docker

Full setup for a machine that has **no Docker installed**. Follow top to bottom;
it takes about 20–30 minutes, most of which is the MySQL download.

> **Why this guide exists:** Docker was never running the app. It only ran two
> things — **MySQL** (the database) and **Adminer** (a web page for browsing the
> database). The app itself (Node backend + React frontend) always ran directly
> on your machine with `npm`. So the only thing to replace is MySQL.

| Piece | With Docker | Without Docker (this guide) |
|---|---|---|
| Database | `mysql:8` container | MySQL 8 installed on your PC (Step 2) |
| DB browser | Adminer at `:8080` | MySQL Workbench / phpMyAdmin / CLI (Step 8) |
| Backend API | `npm run dev` in `server/` | **unchanged** |
| Frontend | `npm run dev` / `npm run build` in `client/` | **unchanged** |

---

## Step 1 — Install Node.js

The backend needs **Node 18 or newer**. Node 20 LTS or 22 LTS is recommended.

1. Download the **LTS** installer: https://nodejs.org/en/download
2. Run it, accept the defaults (this also installs `npm`).
3. Open a **new** terminal and verify:

```powershell
node -v    # must print v18.x or higher
npm -v
```

Also install **Git** if you don't have it: https://git-scm.com/downloads

```powershell
git --version
```

---

## Step 2 — Install MySQL 8

Pick **one** of the two options. Option A is what production uses, so it's the
closer match. Option B is faster and gives you a database browser for free.

### Option A — MySQL Community Server (recommended)

1. Download **MySQL Installer for Windows**:
   https://dev.mysql.com/downloads/installer/
   (choose the smaller "web" installer — it downloads what it needs)
2. Run it and pick these options:

   | Installer screen | Choose |
   |---|---|
   | Choosing a Setup Type | **Server only** (or *Custom* → MySQL Server + MySQL Workbench) |
   | Type and Networking | Config Type: **Development Computer**, Port: **3306** |
   | Authentication Method | **Use Strong Password Encryption** (the default is fine) |
   | Accounts and Roles | **MySQL Root Password: `admin123`** ← must match `.env` in Step 4 |
   | Windows Service | Keep **MySQL80**, tick *Start the MySQL Server at System Startup* |

3. Finish the wizard, then confirm the service is running:

```powershell
Get-Service MySQL80
# If it says Stopped:
net start MySQL80
```

4. **Add the MySQL tools to your PATH** so `mysql` works in any terminal.
   Windows → search "Environment Variables" → *Edit the system environment
   variables* → **Environment Variables…** → under *System variables* select
   **Path** → **Edit** → **New** → paste:

```
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

   Open a **new** terminal and verify:

```powershell
mysql --version
```

> Not adding it to PATH is fine too — you just have to type the full path
> `& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"` every time.
> The app itself does **not** need `mysql` on the PATH; only you do, for Step 8.

### Option B — XAMPP (easiest, includes phpMyAdmin)

1. Install XAMPP: https://www.apachefriends.org/download.html
2. Open **XAMPP Control Panel** → click **Start** next to **MySQL**
   (you do *not* need to start Apache unless you want phpMyAdmin, see Step 8).
3. XAMPP's root user has **no password**. That means in Step 4 you must leave
   `DB_PASS` **empty**:

```env
DB_USER=root
DB_PASS=
```

> XAMPP ships MariaDB rather than Oracle MySQL. This project's schema and queries
> are plain SQL (no window functions, no JSON columns), so it works fine — but
> production runs real MySQL, so Option A is the safer match.

---

## Step 3 — Get the code

Skip this if someone already copied the project folder to your machine.

```powershell
cd D:\Business\Projects          # or wherever you keep projects
git clone https://github.com/IT21361036/highcool-service-hub.git AC-Project
cd AC-Project
```

Every command from here on runs from that project root.

---

## Step 4 — Create `server\.env`

`.env` holds passwords, so it is **not** in Git — you must create it yourself.

```powershell
Copy-Item server\.env.example server\.env
```

Then open `server\.env` and make it look like this:

```env
# Server
PORT=3000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=admin123          # <-- the root password you set in Step 2
                          #     leave EMPTY if you used XAMPP (Option B)
DB_NAME=ac_service_system

# Auth
JWT_SECRET=dev-only-secret-change-in-production-9f3a7c1e5b2d
JWT_EXPIRES_IN=12h

# First admin (used by db/seed-admin.js)
SEED_ADMIN_NAME=Administrator
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PHONE=0770000000
SEED_ADMIN_PASSWORD=admin123

# SMS (Text.lk) — leave disabled for local dev
SMS_ENABLED=false
TEXTLK_API_KEY=
TEXTLK_SENDER_ID=

# Frontend origin for CORS in dev (Vite)
CLIENT_ORIGIN=http://localhost:5173
```

**`DB_PASS` is the one line that most often gets this wrong.** It must be exactly
the root password from Step 2, or empty for XAMPP.

---

## Step 5 — Install dependencies

Two separate `npm install` runs — the backend and the frontend have their own
`package.json`.

```powershell
cd server
npm install
cd ..\client
npm install
cd ..
```

---

## Step 6 — Create the tables and the admin login

**First time only.** Run both, in this order, from `server/`:

```powershell
cd server
npm run db:init      # creates the ac_service_system database + 9 tables
npm run seed:admin   # creates the admin user you'll log in with
```

Expected output:

```
Running schema.sql ...
Database initialised (9 tables ready).

Seeded admin user id=1
  username: admin
  password: admin123  (change after first login)
```

Both are safe to re-run — `db:init` uses `CREATE ... IF NOT EXISTS`, and
`seed:admin` skips if the admin already exists.

### Optional — load demo data

Gives you 5 sample customers covering every screen (unassigned jobs, a job in
progress, a completion awaiting approval, a postponed visit, a renewal chain,
cancelled and deleted jobs), so the UI isn't empty while you explore:

```powershell
npm run seed:demo
```

All demo rows use phone numbers starting `07999`, and re-running replaces only
those — real data is never touched. Demo photo rows point at placeholder paths,
so photo *counts* appear but thumbnails will 404. That's expected.

---

## Step 7 — Run the app

Pick **one** mode.

### Option A — Production-style (one URL, one terminal)

The Express server serves the built React app. Use this when you just want to
*use* the app.

```powershell
cd client
npm run build        # only needed again after frontend code changes
cd ..\server
npm run dev
```

Open **http://localhost:3000/admin**

### Option B — Dev mode (hot reload while editing the UI) — two terminals

```powershell
# Terminal 1 — backend
cd server
npm run dev
```

```powershell
# Terminal 2 — frontend
cd client
npm run dev
```

Open **http://localhost:5173/admin**

Vite proxies `/api` calls to `http://localhost:3000`, so **both** terminals must
be running in this mode. No `npm run build` needed here.

---

## Step 8 — Verify it actually works

**1. Check the backend can reach MySQL.** Open:

**http://localhost:3000/api/health**

You want:

```json
{ "ok": true, "db": true, "time": "..." }
```

- `"db": true` → database is connected. You're done, go log in.
- `"db": false` → the server is up but MySQL is not reachable. Go to
  Troubleshooting below; it is almost always a wrong `DB_PASS` or a stopped
  MySQL service.

**2. Log in.** Login is by **username + password** (phone is contact info only):

- **Username:** `admin`
- **Password:** `admin123`

### Browsing the database (the Adminer replacement)

| If you installed | Use |
|---|---|
| MySQL + Workbench (Option A) | **MySQL Workbench** → new connection → `localhost:3306`, user `root`, password `admin123` |
| MySQL, server only (Option A) | The CLI, see below |
| XAMPP (Option B) | Start **Apache** in the XAMPP panel, then open http://localhost/phpmyadmin |

CLI version — works with any of the above:

```powershell
mysql -u root -p ac_service_system
# then, at the mysql> prompt:
SHOW TABLES;
SELECT id, name, username, role FROM users;
exit
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ECONNREFUSED ::1:3306` / `connect ECONNREFUSED` | MySQL isn't running | `net start MySQL80`, or click **Start** on MySQL in the XAMPP panel |
| `ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'` | `DB_PASS` in `server\.env` doesn't match your real root password | Fix `DB_PASS` (empty for XAMPP), then restart the server |
| `ER_BAD_DB_ERROR: Unknown database 'ac_service_system'` | Step 6 was skipped | `cd server; npm run db:init` |
| `/api/health` shows `"db": false` | Any of the three above | Read the backend terminal — the real error is printed there |
| Login says *Invalid credentials* | `seed:admin` never ran | `cd server; npm run seed:admin` |
| `Frontend build not found. Run npm run build in client/.` | Using Option A without building | `cd client; npm run build` |
| `EADDRINUSE :::3000` | Something else owns port 3000 | Change `PORT` in `server\.env`, and update the proxy target in [client/vite.config.js](AC-Project/client/vite.config.js) to match |
| Port 3306 already in use during MySQL install | An old MySQL (or a Docker MySQL on another machine setup) is bound to it | Stop the other one, or install on port `3307` and set `DB_PORT=3307` in `.env` |
| `mysql : The term 'mysql' is not recognized` | PATH step skipped | Redo Step 2.4, or use the full path to `mysql.exe` |
| `ER_NOT_SUPPORTED_AUTH_MODE` | Rare auth-plugin mismatch | In the MySQL CLI: `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'admin123'; FLUSH PRIVILEGES;` |
| Sinhala route names show as `???` | Database was created outside `db:init` without utf8mb4 | Drop the database and re-run `npm run db:init` |
| Frontend changes don't appear | Option A serves a *build* | Re-run `npm run build`, or switch to Option B (dev mode) |

---

## Quick reference

| Purpose | Command / URL |
|---|---|
| Start MySQL (Option A) | `net start MySQL80` |
| Stop MySQL (Option A) | `net stop MySQL80` |
| Start MySQL (Option B) | XAMPP Control Panel → **Start** next to MySQL |
| Check MySQL status | `Get-Service MySQL80` |
| Create tables (first time) | `cd server; npm run db:init` |
| Create admin login (first time) | `cd server; npm run seed:admin` |
| Load demo data (optional) | `cd server; npm run seed:demo` |
| Start backend | `cd server; npm run dev` |
| Build frontend | `cd client; npm run build` |
| Start frontend (dev) | `cd client; npm run dev` |
| Health check | http://localhost:3000/api/health |
| App (prod-style) | http://localhost:3000/admin |
| App (dev mode) | http://localhost:5173/admin |

### Ports

| Service | Port |
|---|---|
| Backend API + served UI | 3000 |
| Frontend dev server (Vite) | 5173 |
| MySQL | 3306 |

---

## Every day after the first setup

MySQL runs as a Windows service, so it starts with your PC. Nothing to start
manually (Option A):

```powershell
cd server
npm run dev
```

Then open **http://localhost:3000/admin**.

With XAMPP you must click **Start** next to MySQL in the control panel first.

---

## macOS / Linux

Same steps, different install commands:

```bash
# macOS (Homebrew)
brew install mysql
brew services start mysql
mysql_secure_installation      # set the root password to admin123

# Ubuntu / Debian
sudo apt update && sudo apt install mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

Then continue from **Step 3**. Use `cp` instead of `Copy-Item`, and forward
slashes in paths (`cd server`, `cp server/.env.example server/.env`).
