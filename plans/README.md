# Build Plans — Highcool AC Service Management System

This folder tracks the phased implementation of the system. Each phase has its own folder containing:

- **`plan.md`** — the concrete tasks for that phase, mapped from `design-plans/08_Implementation_Plan_Step_By_Step.md`, with build notes and the checkpoint that marks the phase "done".
- **`issues.md`** — risks, gotchas, and problems we expect (or hit) in that phase, with mitigations.

The source of truth for *what* to build lives in [`../design-plans/`](../design-plans/). This folder is the *how / progress* layer on top of it.

## Phase Index & Status

| Phase | Folder | Focus | Status |
|---|---|---|---|
| 1 | [phase-01-setup-db-auth](phase-01-setup-db-auth/) | Project setup, DB schema, authentication, users & pricing | ✅ Complete & verified end-to-end |
| 2 | [phase-02-customer-agreement](phase-02-customer-agreement/) | Customer & agreement registration, AS- numbering, scheduler | ✅ Complete & verified end-to-end |
| 3 | [phase-03-calendar-scheduling](phase-03-calendar-scheduling/) | Calendar, assignment, postpone/cancel/soft-delete | ⚪ Not started |
| 4 | [phase-04-technician-mobile](phase-04-technician-mobile/) | Technician mobile module, photo upload, type tagging | ⚪ Not started |
| 5 | [phase-05-sms-complete-requests](phase-05-sms-complete-requests/) | SMS automation, reminder cron, Job Complete Requests | ⚪ Not started |
| 6 | [phase-06-jobcard-print-pdf](phase-06-jobcard-print-pdf/) | Job card print & PDF view | ⚪ Not started |
| 7 | [phase-07-archive-renewal](phase-07-archive-renewal/) | Archive, renewal, deleted jobs, cancellations | ⚪ Not started |
| 8 | [phase-08-reporting](phase-08-reporting/) | Technician performance reporting dashboard | ⚪ Not started |
| 9 | [phase-09-deployment](phase-09-deployment/) | Deployment to cPanel | ⚪ Not started |
| 10 | [phase-10-domain-golive](phase-10-domain-golive/) | Domain go-live & UAT | ⚪ Not started |

## Legend

- ✅ Complete
- 🟡 In progress
- ⚪ Not started
- 🔴 Blocked

## Conventions

- **Backend:** Node.js + Express, `mysql2` (promise pool), in [`../server/`](../server/)
- **Frontend:** React + Vite, in [`../client/`](../client/)
- **DB:** MySQL, 9 tables (see `design-plans/06_Database_Design.md`)
- **Routing:** whole app mounted under `/admin` (root reserved for future showcase site)
- **Auth:** JWT with `{ id, role }`, roles = `admin` / `system_user` / `technician`
