# Overall Design Plan — AC Service Management System (Revised per Wireframes)

A single consolidated view of the system design. Detailed breakdowns live in the other numbered files — this is the "read this first" overview. This version incorporates the client's hand-drawn wireframes.

---

## 1. Purpose

A web-based system for an AC servicing company to manage 1-year service agreements, automated SMS notifications, technician scheduling and job execution (with photo proof), renewals, cancellations, customer history, and performance reporting — fully responsive for admin desktop use and technician mobile use.

## 2. Confirmed Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | MySQL |
| Hosting | Unlimited Hosting Lanka — Node.js/Python Silver plan |
| SMS Gateway | Text.lk |
| File Storage | Server disk (cPanel) |

(Full reasoning in `10_Tech_Stack.md`.)

## 3. User Roles (Revised — now 3, not 2)

| Role | Access |
|---|---|
| **Admin** | Total authority — everything below, plus user management (add/update/delete users) and pricing management |
| **System User** (office staff) | Day-to-day operations — customers, agreements, jobs, technician assignment, renewals, cancellations, reports. **No** user management or pricing access |
| **Technician** | Restricted — own assigned jobs, search by `AS-`, status updates, photo upload (min 4/max 5), tag visit as Normal/H-P, postpone |

Each technician has an **individual login**.

## 4. Core Entities (Revised)

- **Customer** — identified by NIC (search key) and Phone (unique ID)
- **AC Unit** — one or more per customer; now includes **Model, Brand, Indoor Serial, Outdoor Serial**
- **Agreement** — the `AS-` numbered 1-year contract, one per AC unit; now tracks **Normal count + H/P count + Period(days) + Price** instead of one fixed service type
- **Job** — an individual scheduled visit; now tracks **which type it turned out to be (Normal/H-P)**, an **admin-confirmation flag**, postpone days, cancel reason, and comments
- **Job Photo** — proof-of-work images, min 4/max 5 per job
- **SMS Log** — record of every message sent
- **Pricing** — Admin-managed default price per service type (**new**)
- **User** — admin/system user/technician login accounts

(Full schema in `06_Database_Design.md`.)

## 5. Core Modules / Screens (Revised)

**Admin (14 screens, up from 9):** Dashboard, Customer Search, Customer Profile, New Agreement (Create Job), Renew Agreement, Calendar, Job Slot (detail/postpone/cancel/print/PDF), Job Card print, **Job Complete Requests (new)**, **Deleted Jobs (new)**, **Job Cancellations (new)**, Archive, Reports, SMS Templates, **Add Users (new, Admin-only)**, **Add Price (new, Admin-only)**

**Technician (4 screens):** Login, Today's Jobs, Job Search, Job Detail (start/photo upload/type-tag/complete/postpone)

## 6. Key Business Rules (Revised)

1. Data is only entered into the system **after** full payment is confirmed
2. Every AC unit gets its own `AS-` number, serial, never reused
3. **New:** An agreement allocates a **mix** of Normal and H/P visits (counts) rather than one fixed type, spaced by a chosen **Period** (30/60/90/120 days)
4. **New:** Each visit's actual type (Normal or H/P) is tagged by the technician when performed, not pre-assigned
5. Renewal issues a **new** `AS-` number, links to the old one via `parent_agreement_id` — nothing is overwritten
6. Cancellation is **always** a soft-delete (archive/cancellation view), never a hard delete
7. **New:** Deleted Jobs (mistake corrections) and Job Cancellations (customer-driven) are tracked as **two distinct views**
8. Searching by NIC or Phone always surfaces **every** AC/agreement linked to that person
9. SMS fires automatically at 3 points: activation, 1-day-before reminder, and completion — **completion SMS now fires only after Admin/System User confirms** the technician's completion (Job Complete Requests)
10. Photos: **min 4, max 5** per job, 5MB each, uploaded directly from the technician's phone
11. **New:** Pricing is centrally managed by Admin, applied as a default when creating agreements, still editable per agreement

## 7. Deployment Model — unchanged
One hosting account (cPanel, Node.js/Python Silver) runs everything. (Full architecture in `03_System_Architecture.md`.)

## 8. Cost Summary — unchanged
See `AC_System_Budget_Proposal.docx` for the full breakdown (hosting, domain, SMS).

## 9. Build Sequence
10 phases — see `08_Implementation_Plan_Step_By_Step.md`, updated to include Pricing and User Management (Phase 1), and Job Complete Requests / Deleted Jobs / Job Cancellations (Phase 3/7).

## 10. Still Open / Pending From Client

- Final SMS template wording (activation, reminder, completion)
- Job card exact layout — wireframe gives structure, final visual styling still to confirm
- Final development fee (market range ~700,000–1,000,000 LKR, not yet finalized)
- AS- number format — wireframe examples show a longer numeric string (e.g. "AS260718..."); current design keeps the simpler `AS-00001` serial format unless the client confirms a specific date-encoded format is required
