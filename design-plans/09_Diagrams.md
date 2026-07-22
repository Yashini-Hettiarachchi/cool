# Diagrams — AC Service Management System (Revised per Wireframes)

> Updated after reviewing the client's hand-drawn wireframes: 3 roles, Normal/H-P visit-type tagging, completion approval flow, and status color-coding are now reflected below.

All diagrams in one place, written in **Mermaid** syntax — renders natively in GitHub, GitLab, Obsidian, VS Code (with Mermaid extension), and most modern markdown viewers.

---

## 1. System Architecture (Backend → Frontend → Hosting)

```mermaid
flowchart TB
    subgraph Clients
        A["Admin Browser (Desktop)"]
        T["Technician Browser (Mobile)"]
    end

    subgraph cPanelHosting["Unlimited Hosting Lanka — Node.js/Python Silver (single hosting account)"]
        direction TB
        RP["Passenger (Node.js Selector)"]
        EX["Node.js / Express App<br/>(serves API + React build)"]
        DB[("MySQL Database<br/>7 tables")]
        FS["File Storage<br/>/uploads/job_photos"]
        CRON["cPanel Cron Job<br/>reminderCron.js (daily)"]
    end

    SMS["Text.lk SMS Gateway API"]

    A -- HTTPS --> RP
    T -- HTTPS --> RP
    RP --> EX
    EX --> DB
    EX --> FS
    EX -- REST API call --> SMS
    CRON --> EX
```

---

## 2. Entity Relationship Diagram (Database) — Revised

```mermaid
erDiagram
    CUSTOMERS ||--o{ AC_UNITS : owns
    CUSTOMERS ||--o{ AGREEMENTS : "linked via customer_id"
    AC_UNITS ||--|| AGREEMENTS : "one AC = one active agreement"
    AGREEMENTS ||--o{ JOBS : schedules
    AGREEMENTS ||--o{ AGREEMENTS : "parent_agreement_id (renewal chain)"
    JOBS ||--o{ JOB_PHOTOS : has
    JOBS ||--o{ SMS_LOGS : triggers
    USERS ||--o{ JOBS : "assigned_to (technician_id)"
    PRICING ||--o{ AGREEMENTS : "default price lookup"

    CUSTOMERS {
        int id PK
        varchar name
        varchar phone UK
        varchar nic
        text address
        varchar route
    }
    AC_UNITS {
        int id PK
        varchar model
        varchar brand
        varchar serial_indoor
        varchar serial_outdoor
    }
    AGREEMENTS {
        int id PK
        varchar agreement_no UK
        int normal_count
        int hp_count
        int period_days
        decimal price
        enum status
        int parent_agreement_id FK
    }
    JOBS {
        int id PK
        date scheduled_date
        enum status
        enum service_type_used "normal | hp"
        boolean admin_confirmed
        boolean is_deleted
        int technician_id FK
    }
    USERS {
        enum role "admin | system_user | technician"
    }
    PRICING {
        enum service_type "normal | hp"
        decimal price
    }
```

---

## 3. Data Flow A — Registration → Activation

```mermaid
sequenceDiagram
    participant Tech as Technician (on-site)
    participant Admin
    participant API as Backend API
    participant DB as MySQL
    participant SMS as Text.lk

    Tech->>Admin: Collects details + full payment received
    Admin->>API: POST /api/customers (if new)
    API->>DB: INSERT INTO customers
    Admin->>API: POST /api/agreements
    API->>DB: Generate next AS- number
    API->>DB: INSERT INTO agreements
    API->>DB: INSERT INTO jobs (3 or 4 rows, per service_type)
    API->>SMS: Send Activation SMS
    SMS-->>API: Delivery status
    API->>DB: INSERT INTO sms_logs
```

---

## 4. Data Flow B — Job Lifecycle (Revised: type-tagging + completion approval)

```mermaid
sequenceDiagram
    participant Admin
    participant Cron as reminderCron.js
    participant Tech as Technician
    participant API as Backend API
    participant DB as MySQL
    participant SMS as Text.lk

    Admin->>API: PATCH /api/jobs/:id/assign
    API->>DB: UPDATE jobs SET technician_id
    Note over Cron: Runs daily at 8am
    Cron->>DB: SELECT jobs WHERE scheduled_date = tomorrow
    Cron->>SMS: Send Reminder SMS
    Cron->>DB: INSERT INTO sms_logs

    Tech->>API: GET /api/jobs/:as_number
    Tech->>API: PATCH /api/jobs/:id/status (in_progress)
    Tech->>API: POST /api/jobs/:id/photos (min 4, max 5)
    Tech->>API: Tag visit as Normal or H/P
    Tech->>API: PATCH /api/jobs/:id/status (completed, admin_confirmed=false)

    Note over API,DB: Job now sits in "Job Complete Requests" queue

    Admin->>API: Review photos/comments
    Admin->>API: PATCH /api/jobs/:id/confirm
    API->>DB: UPDATE jobs SET admin_confirmed = true
    API->>SMS: Send Completion SMS
    API->>DB: INSERT INTO sms_logs

    alt Customer asks to reschedule
        Tech->>API: PATCH /api/jobs/:id/postpone (days + reason)
        API->>DB: UPDATE jobs (new date + reason)
    else Job needs to be cancelled
        Admin->>API: PATCH /api/jobs/:id/cancel (reason)
        API->>DB: UPDATE jobs SET status = cancelled
    end
```

---

## 5. Data Flow C — Renewal & Archive

```mermaid
sequenceDiagram
    participant Admin
    participant API as Backend API
    participant DB as MySQL

    alt Customer renews
        Admin->>API: POST /api/agreements/:id/renew
        API->>DB: INSERT new agreement (new AS-, parent_agreement_id = old)
        API->>DB: UPDATE old agreement SET status = 'renewed'
        API->>DB: schedulerService generates new year's jobs
    else Customer cancels
        Admin->>API: POST /api/agreements/:id/cancel
        API->>DB: UPDATE agreement SET status = 'cancelled'
        Note over DB: Record kept — moves to Archive view, never deleted
    end
```

---

## 6. Role & Access Diagram (Revised — 3 roles)

```mermaid
flowchart LR
    Login["Login"] -->|role: admin| Admin["Admin Layout"]
    Login -->|role: system_user| SysUser["System User Layout"]
    Login -->|role: technician| TechUI["Technician Layout"]

    Admin --> Dash["Dashboard"]
    Admin --> Cust["Customer Search/Profile"]
    Admin --> NewAgr["New Agreement / Renew AC"]
    Admin --> Cal["Calendar"]
    Admin --> JCR["Job Complete Requests"]
    Admin --> DelJ["Deleted Jobs"]
    Admin --> JobCancel["Job Cancellations"]
    Admin --> Arch["Archive"]
    Admin --> Rep["Reports"]
    Admin --> SmsT["SMS Templates"]
    Admin --> AddUsers["Add Users (Admin only)"]
    Admin --> AddPrice["Add Price (Admin only)"]

    SysUser --> Dash
    SysUser --> Cust
    SysUser --> NewAgr
    SysUser --> Cal
    SysUser --> JCR
    SysUser --> DelJ
    SysUser --> JobCancel
    SysUser --> Arch
    SysUser --> Rep
    SysUser --> SmsT

    TechUI --> Today["Today's Jobs"]
    TechUI --> Search["Job Search (AS-)"]
    TechUI --> Detail["Job Detail: Start/Photo(min4-max5)/Tag Normal-HP/Complete/Postpone"]

    style Admin fill:#1F6F64,color:#fff
    style SysUser fill:#3fb8af,color:#fff
    style TechUI fill:#d9a441,color:#fff
    style AddUsers fill:#8B2C2C,color:#fff
    style AddPrice fill:#8B2C2C,color:#fff
```

---

## 7. URL / Routing Structure

```mermaid
flowchart LR
    Root["yourdomain.lk/"] --> LoginPg["Login Page"]
    Root --> AdminR["/admin/*"]
    Root --> TechR["/technician/*"]
    AdminR --> Dash2["/admin/dashboard"]
    AdminR --> Cust2["/admin/customers"]
    AdminR --> Cal2["/admin/calendar"]
    AdminR --> Arch2["/admin/archive"]
    AdminR --> Rep2["/admin/reports"]
    TechR --> Today2["/technician/jobs"]
    TechR --> JobDetail2["/technician/job/:asNumber"]
```

---

## 8. Deployment / Request Routing on cPanel

```mermaid
flowchart LR
    Browser["Browser Request"] --> Domain["yourdomain.lk"]
    Domain --> Passenger["Passenger (Node.js Selector)"]
    Passenger --> ExpressApp["Express App"]
    ExpressApp -->|"path starts with /api"| ApiRoutes["API Routes → Controllers → MySQL"]
    ExpressApp -->|"any other path"| StaticBuild["Serve React build/index.html"]
```
