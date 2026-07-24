# Folder Structure — AC Service Management System

Single-repo (or single-app-root) structure, since backend and frontend deploy together to one cPanel Node.js app.

```
ac-service-app/                       # Application root on cPanel
│
├── server/                           # Backend (Node.js / Express)
│   ├── app.js                        # Entry point — configures Express, serves API + React build
│   ├── config/
│   │   └── db.js                     # MySQL connection config (reads from env vars)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── customers.routes.js
│   │   ├── agreements.routes.js
│   │   ├── jobs.routes.js
│   │   ├── sms.routes.js
│   │   ├── reports.routes.js
│   │   ├── users.routes.js          # NEW — Admin only: manage system_user/technician accounts
│   │   └── pricing.routes.js        # NEW — Admin only: Normal/H-P pricing
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── customers.controller.js
│   │   ├── agreements.controller.js
│   │   ├── jobs.controller.js
│   │   ├── sms.controller.js
│   │   ├── reports.controller.js
│   │   ├── users.controller.js      # NEW
│   │   └── pricing.controller.js    # NEW
│   ├── models/
│   │   ├── customer.model.js
│   │   ├── acUnit.model.js
│   │   ├── agreement.model.js
│   │   ├── job.model.js
│   │   ├── jobPhoto.model.js
│   │   ├── smsLog.model.js
│   │   ├── user.model.js
│   │   └── pricing.model.js         # NEW
│   ├── services/
│   │   ├── smsService.js             # Text.lk API wrapper + template rendering
│   │   ├── schedulerService.js       # Generates the year's job dates on agreement creation
│   │   └── numberingService.js       # AS- number generator
│   ├── jobs/
│   │   └── reminderCron.js           # Daily cron script — checks jobs due tomorrow
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   └── role.middleware.js        # Role-based route guarding (admin / system_user / technician)
│   ├── uploads/
│   │   └── job_photos/               # Stored technician photos (not publicly browsable)
│   └── package.json
│
├── client/                           # Frontend (React)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CustomerSearch.jsx
│   │   │   │   ├── CustomerProfile.jsx
│   │   │   │   ├── NewAgreement.jsx        # Create Job — customer + AC + agreement (Normal/H-P/Period)
│   │   │   │   ├── RenewAgreement.jsx      # Renew AC — search then reuses NewAgreement-style form
│   │   │   │   ├── Calendar.jsx            # month/year filter, status color-coded day cells
│   │   │   │   ├── JobSlot.jsx             # "Job slot inside" — job detail, postpone/cancel/print/PDF
│   │   │   │   ├── JobCard.jsx             # print + PDF download
│   │   │   │   ├── JobCompleteRequests.jsx # NEW — admin approval queue for technician completions
│   │   │   │   ├── DeletedJobs.jsx         # NEW — soft-deleted jobs view
│   │   │   │   ├── JobCancellations.jsx    # NEW — cancelled jobs view (distinct from Deleted Jobs)
│   │   │   │   ├── Archive.jsx             # cancelled agreements
│   │   │   │   ├── Reports.jsx
│   │   │   │   ├── SmsTemplates.jsx
│   │   │   │   ├── AddUsers.jsx            # NEW — Admin only: manage system_user/technician accounts
│   │   │   │   └── AddPrice.jsx            # NEW — Admin only: manage Normal/H-P default pricing
│   │   │   └── technician/
│   │   │       ├── Login.jsx
│   │   │       ├── TodayJobs.jsx
│   │   │       ├── JobSearch.jsx
│   │   │       └── JobDetail.jsx     # start / photo upload (min 4, max 5) / Normal-or-H-P tag / complete / postpone
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── CalendarGrid.jsx      # status color-coded (red/orange/green)
│   │   │   ├── JobCardPrint.jsx      # print + PDF download
│   │   │   └── PhotoUploader.jsx     # enforces min 4 / max 5 photos client-side
│   │   ├── api/
│   │   │   ├── customers.api.js
│   │   │   ├── agreements.api.js
│   │   │   ├── jobs.api.js
│   │   │   ├── sms.api.js
│   │   │   ├── reports.api.js
│   │   │   ├── users.api.js          # NEW
│   │   │   └── pricing.api.js        # NEW
│   │   ├── App.jsx                   # React Router route definitions (basename="/admin")
│   │   └── index.js
│   ├── build/                        # Production build output (uploaded to server/, served by Express)
│   └── package.json
│
├── docs/                             # This entire markdown documentation set
│   ├── 01_Conversation_Summary.md
│   ├── 02_System_Functions_And_Workflows.md
│   ├── 03_System_Architecture.md
│   ├── 04_Folder_Structure.md
│   ├── 05_Overall_Design_Plan.md
│   ├── 06_Database_Design.md
│   ├── 07_Database_Setup_Guide_MySQL.md
│   ├── 08_Implementation_Plan_Step_By_Step.md
│   ├── 09_Diagrams.md
│   ├── 10_Tech_Stack.md
│   └── MEMORY.md
│
├── .env                              # Environment variables (DB creds, JWT secret, Text.lk API key)
├── .gitignore
└── README.md
```

## Notes on Structure

- **Why one repo, not two:** since both frontend and backend deploy to the same cPanel Node.js app, keeping them in one project (`server/` + `client/`) simplifies deployment — one Git push, one restart.
- **`client/build/`** is generated, not hand-written — regenerate with `npm run build` inside `client/` whenever frontend code changes, then it gets served by `server/app.js`.
- **`uploads/job_photos/`** lives inside `server/`, not `client/public/` or any public-facing folder — this is what keeps photos from being directly browsable by URL guessing.
- **`.env`** holds all secrets and is never committed to Git — cPanel's Node.js App interface also lets you set these as environment variables directly in its UI.
- **Routing note (revised):** the root domain is reserved for a future company showcase site — this entire application (Admin + Technician) is mounted under `/admin` via Express (`app.use('/admin', ...)`) and React Router's `basename="/admin"`, so no folder here needs restructuring, only the routing configuration in `app.js` and `App.jsx`.
