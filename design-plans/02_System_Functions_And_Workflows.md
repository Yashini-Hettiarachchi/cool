# System Functions & Workflows — AC Service Management System (Revised per Wireframes)

Every function in the system, what it does, what triggers it, and exactly how it works end to end. Updated after reviewing the client's hand-drawn wireframes.

---

## 1. Authentication & Roles (Revised — now 3 roles)

**What it does:** Controls who can access what.

**Roles:**
- **Admin** — total authority: everything System User can do, **plus** user management (add/update/delete users) and pricing management (Add Price)
- **System User** (office staff) — day-to-day operations: create/edit customers, agreements, jobs, assign technicians, renew, cancel/archive, view reports — **no** access to user management or pricing
- **Technician** — restricted: own assigned jobs only, search by `AS-` number, update job status, upload photos, postpone

**How it works:**
1. User logs in with phone/username + password (`POST /api/auth/login`)
2. Backend verifies password (bcrypt), issues a JWT token containing `user_id` + `role`
3. Frontend stores the token, attaches it to every subsequent API request
4. Backend middleware checks the token's role on every protected route — Technicians blocked from admin/system-user routes; System Users blocked from user-management and pricing routes; only Admin passes those checks

---

## 2. Customer Registration — unchanged
Same as before: admin/system user enters details **after** full payment is confirmed. Fields: name, phone (unique), NIC (indexed), address, route.

---

## 3. AC Unit Registration (Expanded)

**What it does:** Represents one physical AC unit belonging to a customer — now with much richer detail per the wireframe.

**Fields captured:** Model, Brand, **Serial Number (Indoor unit)**, **Serial Number (Outdoor unit)** — since split ACs have two physical units, both are tracked separately.

**How it works:**
1. Each AC is added under a customer, with Model/Brand/dual serials
2. One customer can have multiple AC units — each gets its own agreement and `AS-` number
3. Entering a customer's NIC always surfaces **all** AC units linked to them
4. "+ Add AC" button lets admin/system user add another AC unit to the same customer without leaving the form

---

## 4. Agreement Creation & AS- Numbering — numbering unchanged, service model revised

**What it does:** Creates the 1-year service contract tied to one AC unit.

**How it works:**
1. Admin/system user fills the Create Job form: customer details, AC details, then Agreement data
2. `numberingService.js` generates the next `AS-` serial — global auto-increment, never reused
3. **Instead of picking one fixed "Normal" or "Hybrid" type**, the form now captures:
   - **Normal count** — how many Normal-type visits this agreement includes
   - **H/P count** — how many Hybrid-type visits this agreement includes
   - **Period** — days between each visit (30 / 60 / 90 / 120, selectable presets)
   - **Price** — pulled from the Pricing table by default, editable per agreement
4. `start_date` = today, `end_date` = start_date + 1 year, status = `active`

---

## 5. Service Type Model (Revised — replaces old Normal-vs-Hybrid toggle)

**Old model:** One fixed type per agreement (Normal = 3 visits/year, Hybrid = 4+ visits/year).

**New model (per wireframe):** An agreement can mix both types — e.g. 2 Normal visits + 2 H/P visits, spaced 90 days apart. The **total number of visits generated = Normal count + H/P count**. Each individual visit isn't pre-labeled Normal or H/P at creation — instead, the **technician tags each visit** as Normal or H/P when they actually perform it (seen on the technician's "Inside Job" screen as a Normal/H-P selector). This tagging decrements the corresponding count.

**Example:** Normal=2, H/P=2, Period=90 days → system schedules 4 visits, 90 days apart. As each visit happens, the technician marks it Normal or H/P.

---

## 6. Automatic Job Scheduling (Revised)

**What it does:** Generates the year's service visit dates the moment an agreement is created.

**How it works:**
1. `schedulerService.js` runs right after agreement creation
2. Creates `(normal_count + hp_count)` rows in `jobs`, spaced `period_days` apart, starting from `start_date`
3. Each job starts with status `scheduled`, no technician assigned yet, and `service_type_used` left blank (set later by the technician)

---

## 7. Pricing Management (New — Admin only)

**What it does:** Lets Admin set/update default prices for Normal and H/P service types.

**How it works:**
1. Admin-only screen ("Add Price")
2. `pricing` table stores one row per service type with a price
3. When creating a new agreement, the form pre-fills `price` from this table (still editable per individual agreement, since some customers may negotiate differently)

---

## 8. User Management (New — Admin only)

**What it does:** Lets Admin add, update, or deactivate System User and Technician accounts.

**How it works:**
1. Admin-only screen ("Add Users" with manage: Add/Update/Delete)
2. Creates rows in `users` with the appropriate role
3. "Delete" is implemented as deactivation (`active = FALSE`), not a hard delete, to preserve historical job/report links to that user

---

## 9. SMS Automation (3 Templates) — trigger point refined

**What it does:** Sends automatic SMS at 3 points in the lifecycle, via **Text.lk**.

| Trigger | Template Type | When It Fires |
|---|---|---|
| Agreement created | Activation | Immediately after registration |
| 1 day before scheduled job | Reminder | Daily cron job checks tomorrow's jobs |
| Job **confirmed** complete | Completion | Fires when **admin confirms** the technician's completion (see function 12 — Job Complete Requests), not the instant the technician taps Complete |

**How it works:**
1. `smsService.js` wraps the Text.lk REST API
2. Every send is logged in `sms_logs`
3. Reminder driven by a daily cPanel cron job (`reminderCron.js`)

---

## 10. Calendar View (Expanded per wireframe)

**What it does:** Shows every scheduled job visually, by date, with status color-coding.

**Status colors (confirmed from wireframe):**
- 🔴 **Red** = Active/Scheduled
- 🟠 **Orange** = Postponed
- 🟢 **Green** = Complete

**How it works:**
1. Top-level dashboard shows search (by id/phone/AS-), "+ Create Job", "+ Renew Job" buttons, a Job Calendar widget, and a Job Complete Requests widget
2. Detailed Calendar screen: search bar, Month/Year filter, status counters (Active / Postponed / Complete, each with a count), and a month grid
3. Each day cell shows colored dots representing that day's jobs by status
4. Clicking a day ("Inside day") expands to a list: AC count, customer name, `AS-` number, status badge with icon (● Active, ! Postponed, ✓ Complete)

---

## 11. Technician Assignment — unchanged
Admin/system user selects a job, assigns a technician via `PATCH /api/jobs/:id/assign`.

---

## 12. Job Complete Requests (New)

**What it does:** A review queue — technicians marking a job "complete" doesn't finalize it instantly; it goes into a queue for Admin/System User to confirm.

**How it works:**
1. Technician taps Complete → job status becomes `completed`, but `admin_confirmed = FALSE`
2. Job appears in the **Job Complete Requests** screen (admin-facing)
3. Admin/system user reviews (can check photos, comments) and confirms
4. Confirming sets `admin_confirmed = TRUE` — **this is what actually triggers the Completion SMS**

---

## 13. Job Card — Print & PDF Download (Expanded)

**What it does:** Generates a reference sheet for a specific job/visit.

**How it works:**
1. `GET /api/jobs/:id/print` renders a print-friendly view
2. **New:** a "Download PDF" button alongside Print, so the job card can be saved/shared digitally, not just printed
3. Shows customer details, address, route, `AS-` number, AC info (model/brand/serials), and comments

---

## 14. Technician Job Execution (Revised: photo minimum + type tagging)

**What it does:** The technician's entire on-site workflow, from their phone browser.

**How it works:**
1. Technician logs in, sees Today's Jobs or searches by `AS-` number, ID, or phone
2. Opens the job ("Inside Job" view) — shows AS- number, a "Customer details" button for quick reference
3. Taps **Start** → job status becomes `in_progress`
4. Uploads photos via phone camera — **minimum 4 required, maximum 5**, 5MB each — job cannot be marked complete below the 4-photo minimum
5. Selects the visit type — **Normal or H/P** — via a selector on this screen (this is what sets `service_type_used`)
6. Adds comments if needed
7. Taps **Complete Job** → status becomes `completed`, `admin_confirmed = FALSE` (goes to the Job Complete Requests queue — function 12)
8. If the customer asks to reschedule → **Postpone** instead (function 15)

---

## 15. Postpone / Cancel (Expanded per wireframe)

**Postpone:**
1. Requires **number of days** to postpone by, **plus a reason**
2. `postponed_from` stores the original date, `postpone_days` + `postpone_reason` logged
3. `scheduled_date` shifts forward by the specified number of days
4. Status becomes `postponed` (shows orange on the calendar)

**Cancel:**
1. Requires a **reason/comment**
2. Status becomes `cancelled`, reason stored in `cancel_reason`
3. Appears in the **Job Cancellations** view (distinct from Deleted Jobs — see function 17)

---

## 16. Search & Filtering (NIC / Phone / AS-) — unchanged
Universal lookup, returns full linked history when searching by NIC or Phone; direct jump when searching by `AS-`.

---

## 17. Deleted Jobs vs Job Cancellations (New — two distinct admin views)

- **Deleted Jobs** — jobs soft-deleted at the job level (`is_deleted = TRUE`) — typically for correcting mistakes (e.g. a duplicate or wrongly created job), not a customer-driven cancellation
- **Job Cancellations** — jobs the customer actually cancelled (`status = 'cancelled'`, with a reason logged)

Both are admin-facing list views, both are soft-deletes (never hard-deleted from the database).

---

## 18. Renewal (Revised flow, same numbering logic)

**What it does:** Extends a customer's service for another year.

**How it works:**
1. Admin/system user searches by ID/`AS-`/Phone ("Renew AC" screen)
2. This loads the **same Update/Job form**, pre-filled with the existing AC and agreement details
3. Admin adjusts Model/Brand/Serials/Normal count/H-P count/Period/Price as needed for the new year
4. Taps **Renew** → creates a **new** agreement row with a **new** `AS-` number, `parent_agreement_id` links to the old one, old marked `renewed`
5. Job scheduling (function 6) runs again for the new year

---

## 19. Cancellation & Archiving (Agreement-level) — unchanged
`POST /api/agreements/:id/cancel` soft-deletes the whole agreement (status → `cancelled`), visible in Archive, never hard-deleted.

---

## 20. Customer History & Loyalty Tracking — unchanged
Customer profile shows every agreement ever linked to that NIC/Phone, `created_at` marks loyalty start, renewal chains show year-over-year relationships.

---

## 21. Reporting (Technician Performance) — refined
Counts only **admin-confirmed** completions (not just technician-marked-complete), grouped by day/week/month, filtered by technician.
