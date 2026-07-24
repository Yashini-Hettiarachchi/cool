# Conversation Summary — AC Service Management System

This file summarizes the entire planning conversation for the AC Service Management System, in the order decisions were made. Use this as the master reference for "what was decided and why."

---

## 1. Original Requirement (Client's Raw Scenario)

An AC servicing company needs a system to manage:
- 1-year service agreements paid in full upfront
- Two service types: **Normal** (3 services/year) and **Hybrid** (4+ services/year)
- Automated SMS at 3 points: activation, reminder, completion
- Agreements identified by a serial number prefixed **`AS-`**
- Customers identified by **NIC** (search key) and **Phone** (unique ID)
- One customer can own multiple AC units, each with its own `AS-` number
- A calendar showing all scheduled jobs, clickable per day
- Technicians who search jobs by `AS-` number, execute the job, upload proof photos, and mark complete
- Postpone/reschedule capability for jobs
- Renewal each year (new `AS-` number issued, old one archived, not deleted)
- Cancellation → soft-delete/archive, not permanent deletion
- Customer loyalty/history tracking across years
- Technician performance reporting (jobs/day/week/month)
- Printable job cards
- Fully responsive web app (admin desktop use + technician mobile use)
- Cost-friendly build, reusing an existing `.lk` domain (later corrected — see below)

## 2. Requirements Gathering — Key Clarifications

| Question | Answer |
|---|---|
| Do technicians upload job photos from their phone? | **Yes**, directly via phone browser |
| Existing SMS gateway preference? | None — needed a recommendation |
| Current hosting setup? | cPanel, but PHP was **not** preferred |

## 3. Stack & Hosting Decisions (in order decided)

1. **Frontend + Backend + Database stack:** React + Node.js/Express + MySQL — confirmed cost-friendly (all open-source), and matches the team's existing familiarity with Node/Python.
2. **Hosting provider:** Unlimited Hosting Lanka (UHL) — client's existing registrar/host.
3. **Hosting plan:** From UHL's menu (Budget/Business/Unlimited/Cloud Fast/WordPress/Windows/Email/MySQL/MSSQL/**Node.js-Python**/LMS-CRM-APP), the **Node.js/Python Hosting — Silver tier** (~18,500 LKR/year, 10GB NVMe SSD, 10 MySQL DBs, SSH, free SSL, daily backups) was selected — the only tier that explicitly guarantees Node.js support.
4. **SMS Gateway:** Compared **Notify.lk** (Rs 7,500 one-time fee + Rs 0.60/SMS) vs **Text.lk** (no setup/monthly fee, Rs 0.64–0.84/SMS depending on top-up). **Text.lk confirmed** — better fit given this project's naturally low SMS volume (no upfront cost to justify).
5. **Domain:** Initially assumed the client already owned a `.lk` domain from a prior registration with UHL. **Corrected later:** the domain has **not** been purchased yet — it will be registered (~4,500–5,000 LKR/year) **after** development is complete, just before go-live. Development/testing happens via local dev environment or cPanel's temporary URL in the meantime.

## 4. Other Confirmed Decisions

| Decision | Answer |
|---|---|
| Technician login | **Individual account per technician** (not shared) — enables accurate per-technician reporting |
| Reminder SMS lead time | **1 day before** the scheduled service date |
| Expected year-one scale | Not fixed — architecture comfortably handles small → several thousand customers without redesign |
| Photo upload limit | **Max 5 photos per job, 5MB each** |
| URL structure | Path-based, e.g. `highcool.lk/admin`, `highcool.lk/technician` — not subdomain-based |
| Frontend hosting | **Not separate** — React's production build is served as static files by the same Express app that runs the API, on the same hosting account |

## 5. Documents Produced So Far

| Document | Purpose |
|---|---|
| `AC_Service_Management_System_Plan.md` | First full end-to-end plan (entities, workflows, phases) |
| `Reordered_Scenario_Flow.md` | Client's raw scenario reorganized into chronological order |
| `System_Design.md` | Technical design — architecture, ERD, API endpoints, folder structure |
| `AC_System_Full_Design_Documentation.html` | Consolidated HTML documentation with diagrams |
| `AC_System_Budget_Proposal.docx` | Client-facing budget — development cost range + infrastructure costs |

## 6. Outstanding Open Items (as of this summary)

- Final SMS wording for the 3 templates (activation, reminder, completion)
- Job card exact layout — pending template from client
- Wireframes — pending from client
- Final development fee amount — still being decided internally (market range given: ~700,000–1,000,000 LKR)

## 7. Addendum — Wireframe Review (8 Hand-Drawn Sketches)

The client provided 8 photos of hand-drawn wireframes, which were reviewed and incorporated into the design. This revealed several structural refinements beyond the original plan:

- **3 roles, not 2:** Admin (total authority), System User (day-to-day office staff, no user/pricing management), Technician
- **AC unit details expanded:** Model, Brand, and two serial numbers (indoor + outdoor unit)
- **Service model replaced:** instead of one fixed "Normal or Hybrid" type, an agreement now allocates a **Normal count** + **H/P count** + a **Period** (30/60/90/120 days) — visits are scheduled from the combined count, and each visit is tagged Normal or H/P by the technician when performed
- **Completion approval flow added:** technician marking a job "Complete" now lands it in a **Job Complete Requests** queue; the Completion SMS only fires once Admin/System User confirms
- **Photo upload revised:** minimum 4 required (was previously max-5-only, no minimum)
- **Postpone/Cancel expanded:** postpone now requires a number of days + reason; cancel requires a reason; a new **Deleted Jobs** view (mistake corrections) is kept separate from **Job Cancellations** (customer-driven)
- **New Admin-only features:** Add Users (manage System User/Technician accounts), Add Price (default pricing per service type)
- **Job card:** Print **and** Download PDF (was print-only)
- **Calendar status colors confirmed:** Red = Active, Orange = Postponed, Green = Complete

All of `02`, `05`, `06`, `07`, `08`, `09`, and `MEMORY.md` were revised to reflect this. See `MEMORY.md` for the full list of corrections and what's still open (SMS wording, final job card visual styling, AS- number format confirmation, and a re-quote of the development fee given the added scope).

## 8. What This New File Set Covers

This conversation asked for a complete, implementation-ready markdown package, split into separate files:
1. `01_Conversation_Summary.md` — this file
2. `02_System_Functions_And_Workflows.md` — every function/module explained, how it works
3. `03_System_Architecture.md` — backend → frontend → hosting, end to end
4. `04_Folder_Structure.md` — full project folder structure
5. `05_Overall_Design_Plan.md` — consolidated design plan
6. `06_Database_Design.md` — schema, fields, relationships, ERD
7. `07_Database_Setup_Guide_MySQL.md` — actual SQL to set up MySQL + sample queries
8. `08_Implementation_Plan_Step_By_Step.md` — granular build plan, phase by phase, task by task
9. `09_Diagrams.md` — all diagrams (architecture, ERD, data flow) in Mermaid format
10. `10_Tech_Stack.md` — confirmed stack and why it aligns with Node.js + MySQL
11. `MEMORY.md` — condensed reference memory of this entire project/conversation

## 9. Addendum — Routing Revision (Root Path Reserved)

After reviewing a routing diagram, the client clarified: the root domain (`yourdomain.lk/`) is reserved for a **future company showcase/marketing site** (not part of this system, to be built later). **The entire system — both Admin and Technician sections — now sits under a single `/admin` base path** instead of splitting `/admin` and `/technician` at the root level. Express now serves the React build only under `/admin/*`; React Router uses `basename="/admin"`. Updated in `03_System_Architecture.md`, `09_Diagrams.md`, `04_Folder_Structure.md`, `05_Overall_Design_Plan.md`, and `MEMORY.md`.
