# Implementation Plan — Step by Step

Granular build plan, broken into 10 phases with individual tasks. Follow in order — each phase builds on the previous one.

---

## Phase 1 — Project Setup, Database Schema, Authentication

1. Initialize Node.js project (`npm init`), install Express, mysql2 (or Sequelize), bcrypt, jsonwebtoken, dotenv
2. Initialize React project (`client/`) via Vite or Create React App
3. Set up `.env` with DB credentials, JWT secret placeholder
4. Create MySQL database and run all `CREATE TABLE` statements, **including the 3-role `users` enum and the new `pricing` table** (see `07_Database_Setup_Guide_MySQL.md`)
5. Build `models/user.model.js` — basic CRUD for users, `models/pricing.model.js` — CRUD for default pricing
6. Build `POST /api/auth/login` — verify phone/password, bcrypt compare, issue JWT with `{ id, role }` (role is one of admin/system_user/technician)
7. Build `auth.middleware.js` — verifies JWT on protected routes
8. Build `role.middleware.js` — checks role matches required access level; **Admin-only guard** specifically for `/api/users/*` and `/api/pricing/*`
9. Seed one Admin user manually to enable first login
10. Build `AddUsers.jsx` (Admin only) — add/update/deactivate System User and Technician accounts
11. Build `AddPrice.jsx` (Admin only) — set default price per service type (Normal/H-P)
12. Frontend: build Login screen, store JWT (React state, not localStorage), attach token to API calls
13. **Checkpoint:** Admin, System User, and Technician can all log in and get correctly routed/restricted by role; Admin can manage users and pricing

## Phase 2 — Customer & Agreement Registration

1. Build `models/customer.model.js`, `models/acUnit.model.js` (with model/brand/serial_indoor/serial_outdoor), `models/agreement.model.js` (with normal_count/hp_count/period_days/price)
2. Build `GET /api/customers/search` — search by NIC / phone / AS-
3. Build `POST /api/customers` — create customer, checking for existing NIC/phone first
4. Build `numberingService.js` — generates next `AS-` number
5. Build `POST /api/agreements` — creates agreement + AC unit link + calls numberingService; **pulls default price from `pricing` table**, editable before saving
6. Build `schedulerService.js` — generates `(normal_count + hp_count)` job rows, spaced `period_days` apart
7. Build `smsService.js` — Text.lk API wrapper; wire up the Activation SMS trigger on agreement creation
8. Frontend: build `CustomerSearch.jsx`, `CustomerProfile.jsx`, `NewAgreement.jsx` — form includes Model/Brand/Serial(in)/Serial(out), Normal count, H/P count, Period (30/60/90/120 preset buttons), Price, "+ Add AC" for multiple units
9. **Checkpoint:** Can register a new customer, create an agreement with a mix of Normal/H-P visits on a chosen period, get an `AS-` number, and see an activation SMS logged

## Phase 3 — Calendar, Scheduling, Assignment, Postpone/Cancel

1. Build `GET /api/jobs?date=` — jobs for a specific day
2. Build `PATCH /api/jobs/:id/assign` — assign technician
3. Build `PATCH /api/jobs/:id/postpone` — takes number of days + reason, shifts `scheduled_date` forward
4. Build `PATCH /api/jobs/:id/cancel` — takes a reason, sets status `cancelled`
5. Build `PATCH /api/jobs/:id/soft-delete` — sets `is_deleted = TRUE` (mistake correction, distinct from cancel)
6. Frontend: build `Calendar.jsx` — month/year filter, status counters, color-coded day cells (🔴 Active, 🟠 Postponed, 🟢 Complete)
7. Frontend: build `JobSlot.jsx` — job detail view with Postpone (days + reason), Cancel (reason), Print, Download PDF, Comments
8. Frontend: build `DeletedJobs.jsx` and `JobCancellations.jsx` as two separate admin views
9. Frontend: build technician assignment UI (dropdown/select on a job)
10. **Checkpoint:** Jobs appear color-coded on the calendar; admin can assign a technician, postpone with a reason, cancel with a reason, or soft-delete a mistaken entry — each tracked separately

## Phase 4 — Technician Mobile Module

1. Build `GET /api/jobs/:as_number` — technician lookup by AS- number
2. Build `PATCH /api/jobs/:id/status` — in_progress / completed transitions; completed also requires `service_type_used` (Normal or H/P)
3. Install and configure `multer` for file uploads
4. Build `POST /api/jobs/:id/photos` — enforce **min 4, max 5** photos, 5MB each (check count + size server-side, not just frontend); block "Complete" if fewer than 4 photos exist
5. Build `GET /api/jobs/:id/photos/:photoId` — authenticated photo retrieval
6. Frontend: build `TodayJobs.jsx`, `JobSearch.jsx`, `JobDetail.jsx` with `<input type="file" capture="environment" multiple>` for camera access, a Normal/H-P selector, and a comments field
7. Mobile-first CSS — large touch targets, simple single-column layout
8. **Checkpoint:** Technician can log in on a phone, search a job, upload 4–5 photos, tag the visit type, add a comment, and mark it complete (which puts it into the Job Complete Requests queue, not instantly finalized)

## Phase 5 — SMS Automation & Job Complete Requests

1. Finalize `smsService.js` template rendering (activation, reminder, completion)
2. Build `reminderCron.js` — queries jobs scheduled for tomorrow, sends reminder SMS, logs to `sms_logs`
3. Set up the cPanel cron job entry (daily, e.g. 8am) pointing to `reminderCron.js`
4. Build `GET /api/jobs/complete-requests` — lists jobs where `status='completed'` and `admin_confirmed=FALSE`
5. Build `PATCH /api/jobs/:id/confirm` — Admin/System User confirms completion, sets `admin_confirmed=TRUE`, **this triggers the Completion SMS** (not the technician's initial "Complete" tap)
6. Frontend: build `JobCompleteRequests.jsx` — review queue showing photos/comments, with a Confirm action
7. Build `GET /api/sms/templates` and a simple admin UI to edit template wording
8. Build `GET /api/sms/logs` — admin-facing SMS history view
9. **Checkpoint:** Technician completions land in the Job Complete Requests queue; confirming one fires the Completion SMS and logs it; reminder cron runs on schedule

## Phase 6 — Job Card Print & PDF View

1. Build `GET /api/jobs/:id/print` — returns print-friendly HTML (or a printable React view)
2. Add a **Download PDF** option alongside Print (e.g. render to PDF server-side, or use the browser's print-to-PDF as an interim solution)
3. Style for clean printing (hide nav/buttons in print CSS via `@media print`)
4. Once client provides their exact job card template, adjust layout to match
5. **Checkpoint:** A job card can be opened, printed, and downloaded as a PDF cleanly

## Phase 7 — Archive, Renewal, Deleted Jobs, Job Cancellations

1. Build `POST /api/agreements/:id/cancel` — soft-delete, sets status to cancelled
2. Build `GET /api/agreements/archived` — lists cancelled agreements
3. Build `GET /api/agreements/search` (by ID/AS-/Phone) — powers the "Renew AC" search step
4. Build `POST /api/agreements/:id/renew` — new AS- number, `parent_agreement_id` link, old marked `renewed`; pre-fills Model/Brand/Serials/Normal/H-P/Period/Price from the existing agreement for editing
5. Frontend: build `Archive.jsx`, `RenewAgreement.jsx` (search → reuses the same form layout as New Agreement, pre-filled)
6. Confirm `DeletedJobs.jsx` and `JobCancellations.jsx` (built in Phase 3) are fully wired to their respective queries
7. **Checkpoint:** Cancelling moves an agreement to Archive (not deleted); renewing creates a fresh AS- linked to history, pre-filled from the old record; Deleted Jobs and Job Cancellations show correctly as separate lists

## Phase 8 — Reporting Dashboard

1. Build `GET /api/reports/technician/:id?range=day|week|month` — counts only **admin-confirmed** completions
2. Frontend: build `Reports.jsx` — technician selector + date range + job count display (table or simple chart)
3. **Checkpoint:** Admin can view how many jobs each technician actually had confirmed-complete over a chosen period

## Phase 9 — Deployment to cPanel

1. Confirm/activate **Setup Node.js App** in cPanel (Node version, app root, startup file `app.js`)
2. Create the MySQL database + user via cPanel's MySQL Databases tool
3. Set environment variables in the Node.js App interface (DB creds, JWT secret, Text.lk API key)
4. Push code via cPanel Git Version Control (or SFTP), run **NPM Install**, click **Restart**
5. Build React locally (`npm run build`), upload `build/` into the server's `client/build` path
6. Set up the daily cron job for `reminderCron.js`
7. Test via cPanel's temporary URL (domain not purchased yet at this point)
8. **Checkpoint:** Full app is live and functional on the temporary hosting URL

## Phase 10 — Domain Go-Live & UAT

1. Purchase the `.lk` domain (~4,500–5,000 LKR/year)
2. Point domain to hosting account (nameservers or A record)
3. Attach domain in cPanel, update Node.js App's Application URL
4. Confirm free Let's Encrypt SSL is issued and active
5. Run full UAT with the client using real wireframes (once provided) and their exact job card template
6. Finalize SMS template wording with the client
7. Fix any issues found during UAT
8. **Go live**

---

## Suggested Order of Priority If Timeline Is Tight

If phases need to be compressed, this is the minimum viable sequence to get a usable system in front of the client fastest:

1. Phase 1 (auth) → 2. Phase 2 (registration + AS-) → 3. Phase 3 (calendar) → 4. Phase 4 (technician + photos) → then SMS, print, archive, reporting can follow in any order since they don't block each other.
