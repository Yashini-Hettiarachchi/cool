# MEMORY — AC Service Management System

Condensed, structured project memory. Purpose: if this conversation is picked up again later (new chat, new team member, or Claude with no context), this file alone should be enough to get back up to speed instantly.

**Last updated:** after reviewing the client's 8 hand-drawn wireframe photos — several structural changes below.

---

## Project
Web-based **AC Service Management System** for an AC servicing company. Manages 1-year service agreements, technician scheduling, automated SMS, photo-proof job execution, renewals, and reporting.

## Confirmed Stack
- Frontend: **React**
- Backend: **Node.js + Express**
- Database: **MySQL**
- Hosting: **Unlimited Hosting Lanka — Node.js/Python Silver plan** (~18,500 LKR/year, 10GB NVMe SSD, 10 MySQL DBs)
- SMS: **Text.lk** (confirmed twice — pay-as-you-go, no setup fee, Rs 0.64–0.84/SMS)
- Deployment: single Express app serves both API and React static build — no separate frontend hosting

## URL Structure — REVISED (root path reserved for future showcase site)
The root domain (`yourdomain.lk/`) is **reserved for a future company showcase/marketing site** — not part of this system, to be built at a later stage (not now). **The entire system — both Admin and Technician sections — is mounted under a single `/admin` base path** instead of splitting across `/admin` and `/technician` at the root level. React Router uses `basename="/admin"`; Express serves the React build only under `/admin/*` (`app.use('/admin', express.static(...))` + `app.get('/admin/*', ...)`), leaving `/` free for the future site (currently a placeholder or redirect to `/admin`).

Example paths: `yourdomain.lk/admin/` (login), `/admin/dashboard`, `/admin/customers`, `/admin/calendar`, `/admin/technician/jobs`, `/admin/technician/job/:asNumber`.

## Domain Status
**Not yet purchased.** Will be bought (~4,500–5,000 LKR/year) **after** development is complete, just before go-live.

## Roles — REVISED: now 3, not 2
- **Admin** — total authority: everything + user management (add/update/delete users) + pricing management
- **System User** (office staff) — day-to-day ops: customers, agreements, jobs, technician assignment, renewals, cancellations, reports. **No** user management or pricing access
- **Technician** — own jobs only, individual login (not shared)

## Service Model — REVISED (this is the biggest change)
**Old:** one fixed type per agreement — Normal (3 visits/year) OR Hybrid (4+ visits/year).
**New (per wireframe, confirmed by client):** an agreement has **two separate counters** — `normal_count` and `hp_count` — plus a **`period_days`** field (30/60/90/120 preset options). Total visits scheduled = `normal_count + hp_count`, spaced `period_days` apart. Each individual visit is **not** pre-labeled — the **technician tags it Normal or H/P at execution time** (decrements the relevant count). Example: normal_count=2, hp_count=2, period_days=90 → 4 visits scheduled 90 days apart; technician tags each one as they do it.

## AC Unit Fields — EXPANDED
Now includes: **Model, Brand, Serial Number (Indoor unit), Serial Number (Outdoor unit)** — not just a generic label. Split ACs have two physical units, both serials tracked separately.

## Completion Flow — REVISED (new approval step)
Technician tapping "Complete" does **not** immediately finalize the job or send the Completion SMS. It sets `status='completed'` but `admin_confirmed=FALSE`, landing in a new **"Job Complete Requests"** queue. Admin/System User reviews and confirms (`admin_confirmed=TRUE`) — **this confirmation is what actually triggers the Completion SMS.**

## Photo Upload — REVISED
**Minimum 4 required, maximum 5**, 5MB each (was previously "max 5" with no minimum).

## Postpone / Cancel — EXPANDED
- **Postpone:** requires **number of days** + a reason (not just a new date)
- **Cancel:** requires a reason/comment, goes to a **Job Cancellations** view
- **Deleted Jobs** is a **separate** view from Job Cancellations — soft-deletes for mistake corrections (duplicate/wrong entry), distinct from a customer-driven cancellation

## New Admin-Only Features (from wireframes)
- **Add Users** — Admin manages System User and Technician accounts (add/update/deactivate)
- **Add Price** — Admin manages default pricing per service type (Normal/H-P), pre-fills into new agreements (still editable per agreement)

## New Admin Views (from wireframes)
- **Job Complete Requests** — approval queue (see Completion Flow above)
- **Deleted Jobs** — soft-deleted jobs (mistakes)
- **Job Cancellations** — customer-cancelled jobs (distinct from Deleted Jobs)

## Calendar Status Color Coding (confirmed from wireframe)
🔴 Red = Active/Scheduled · 🟠 Orange = Postponed · 🟢 Green = Complete

## Job Card — EXPANDED
Print **and** Download PDF (was print-only before).

## Renewal Flow — clarified
Search by ID/AS-/Phone ("Renew AC" screen) → loads the **same form** as New Agreement, pre-filled with existing AC/agreement data → admin adjusts Model/Brand/Serials/Normal count/H-P count/Period/Price as needed → "Renew" button → new `AS-` number generated, `parent_agreement_id` links to the old one, old marked `renewed`.

## Confirmed Business Rules (unchanged from before)
- Data entered into system **only after full payment** is received
- Agreement number format: `AS-00001` — one per AC unit, serial, never reused (client's wireframe sketches showed a longer example number, but this wasn't confirmed as a required format — flagged as still-open, see below)
- Customer search keys: **NIC** (primary) and **Phone** (unique ID) — searching either shows ALL linked AC units/agreements
- Renewal → **new** AS- number issued, linked to old via `parent_agreement_id`, old marked `renewed` (never overwritten)
- Cancellation → soft-delete only, moves to Archive/Job Cancellations, **never** hard-deleted
- SMS fires at 3 points: **Activation** (on registration), **Reminder** (1 day before scheduled job — via daily cron), **Completion** (on **admin confirmation**, not technician tap)
- URL structure: **see "URL Structure — REVISED" section above** — root reserved for future showcase site, entire system now under `/admin`

## Database — now 9 Tables (was 7)
`customers`, `ac_units` (expanded), `agreements` (revised), `jobs` (expanded), `job_photos`, `sms_logs`, `users` (3 roles), **`pricing` (new)**.
(Full schema: `06_Database_Design.md`. Setup SQL: `07_Database_Setup_Guide_MySQL.md`.)

## Screens — now 14 Admin (was 9) + 4 Technician (unchanged)
Admin: Dashboard, Customer Search, Customer Profile, New Agreement, **Renew Agreement**, Calendar, **Job Slot (detail)**, Job Card (print+PDF), **Job Complete Requests**, **Deleted Jobs**, **Job Cancellations**, Archive, Reports, SMS Templates, **Add Users**, **Add Price**
Technician: Login, Today's Jobs, Job Search, Job Detail (now includes photo min/max + Normal/H-P tagging + comments)

## Build Plan — 10 Phases (updated task lists, same overall order)
1. DB schema + auth **+ user mgmt + pricing** → 2. Customer/Agreement registration **with Normal/H-P/Period model** → 3. Calendar/scheduling/assignment/**postpone+cancel+deleted-jobs** → 4. Technician mobile module + photos **(min4/max5) + type tagging** → 5. SMS automation **+ Job Complete Requests approval** → 6. Job card print **+ PDF** → 7. Archive/renewal **+ deleted jobs/cancellations views** → 8. Reporting (confirmed-only counts) → 9. Deploy to cPanel (temp URL) → 10. Domain purchase + go-live + UAT
(Granular task breakdown: `08_Implementation_Plan_Step_By_Step.md`)

## Budget (as last discussed — unaffected by wireframe review)
- One-time development fee: **not yet finalized** — market estimate range 350,000–1,200,000+ LKR (mid-estimate ~700,000–900,000 LKR for ~35–45 developer-days). Note: wireframe-driven scope additions (user mgmt, pricing, approval queue, extra views) may push actual effort toward the higher end of this range — not yet re-quoted.
- Recurring: ~18,500 LKR/year hosting + ~4,500–5,000 LKR/year domain (from Year 1, post-dev) + variable SMS cost

## Documents That Exist
1. `AC_Service_Management_System_Plan.md` — original full plan (pre-wireframe)
2. `Reordered_Scenario_Flow.md` — client's raw scenario reorganized chronologically (pre-wireframe)
3. `System_Design.md` — original technical design doc (pre-wireframe)
4. `AC_System_Full_Design_Documentation.html` — consolidated HTML doc w/ diagrams (pre-wireframe)
5. `AC_System_Budget_Proposal.docx` — client-facing budget Word doc (pre-wireframe scope)
6. `01_Conversation_Summary.md` through `10_Tech_Stack.md` — markdown package (02, 05, 06, 07, 08, 09 now **revised** post-wireframe; 01, 03, 04, 10 mostly unaffected structurally but 04 folder structure updated with new screens/routes)
7. This file (`MEMORY.md`)

> **Note:** the first 5 documents above (plan, scenario flow, system design, HTML doc, budget) were created **before** the wireframe review and have **not** been updated to reflect the role/service-model/schema changes below. Treat the numbered `0X_*.md` files as the current source of truth; the earlier documents are historical/pre-wireframe.

## Still Open / Pending
- [ ] Final SMS template wording (activation, reminder, completion)
- [ ] Job card exact visual layout (wireframe gives structure/fields, final styling still TBD)
- [ ] Wireframes — received and incorporated (this update)
- [ ] Final development fee amount (client/team still deciding; scope grew since original estimate)
- [ ] AS- number format — wireframe examples showed a longer string (e.g. "AS260718..."); not yet confirmed whether this is a required date-encoded format or just how the client wrote an example. Current design defaults to simple `AS-00001` serial.

## Key Corrections Made Across This Conversation (don't revert to earlier assumptions)
- ~~Domain already owned~~ → **Domain not yet purchased**, buy after dev, before go-live
- ~~Notify.lk as SMS gateway~~ → **Text.lk confirmed** instead
- ~~PHP as backend~~ → **Node.js/Express confirmed**
- ~~2 roles (Admin, Technician)~~ → **3 roles (Admin, System User, Technician)**
- ~~Single service_type per agreement (Normal or Hybrid)~~ → **normal_count + hp_count + period_days, mixed per agreement, tagged per visit**
- ~~Max 5 photos, no minimum~~ → **Min 4, max 5 photos**
- ~~Technician "Complete" tap = instantly done + SMS sent~~ → **Goes to Job Complete Requests queue; Admin confirmation triggers SMS**
- ~~Job card: print only~~ → **Print + Download PDF**
- ~~One "Archive" view for everything cancelled~~ → **Archive (agreements) + Deleted Jobs + Job Cancellations are three distinct views**
- ~~Root domain (`/`) serves the system's login page, `/technician` at root level~~ → **Root reserved for a future showcase site; entire system (Admin + Technician) moved under `/admin`**
