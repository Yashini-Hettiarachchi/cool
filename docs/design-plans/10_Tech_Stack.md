# Tech Stack — Confirmed & Why It Aligns with Node.js + MySQL

---

## 1. Confirmed Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | **React** | Confirmed |
| Backend | **Node.js + Express** | Confirmed |
| Database | **MySQL** | Confirmed |
| Hosting | **Unlimited Hosting Lanka — Node.js/Python Silver (cPanel)** | Confirmed |
| SMS Gateway | **Text.lk** | Confirmed |
| File Storage | Server disk (within hosting quota) | Confirmed |

---

## 2. Why This Stack Fits Together

**Node.js + MySQL is one of the most common, well-supported pairings in web development** — this isn't a compromise combination, it's a standard, proven one:

- **`mysql2`** or **Sequelize/Knex** (ORMs) connect Node directly to MySQL with mature, well-documented libraries
- Both are free, open-source, with large communities — easy to hire for, easy to find documentation/support for
- MySQL is included **free** with virtually every cPanel hosting plan (including this one) — no separate database hosting cost
- Node.js is explicitly supported on the chosen hosting tier (UHL's Node.js/Python Silver plan uses CloudLinux's Node.js Selector + Passenger)

**Why not a different database (e.g. MongoDB)?**
This system is fundamentally **relational** — a Customer has many Agreements, an Agreement has many Jobs, a Job has many Photos, and there's a self-referencing renewal chain (`parent_agreement_id`). This is exactly the kind of structured, foreign-key-heavy data MySQL is built for. A NoSQL database would add complexity here for no benefit.

**Why React specifically?**
- One codebase serves both the admin (desktop) and technician (mobile) interfaces — fully responsive via CSS, no separate mobile app needed
- Wide talent pool, easy to maintain long-term
- Component-based structure matches this system's screen breakdown (Dashboard, Calendar, JobDetail, etc.) naturally

**Why Express specifically (not Fastify, Koa, NestJS, etc.)?**
- Simplest, most widely-documented Node framework — appropriate for a REST API of this size (~22 endpoints after adding user management and pricing routes per the wireframe review)
- Lower learning curve, faster to build and maintain than a more opinionated framework like NestJS, without sacrificing capability for this project's scope

---

## 3. How Everything Runs Together (Summary)

```
React (built to static files)
        │
        ▼
Node.js/Express (single process, serves API + static frontend)
        │
        ▼
MySQL (same server, localhost connection)
```

One process, one server, one hosting bill — this is the direct result of choosing a stack that's fully compatible with what a single cPanel Node.js hosting account can run.

---

## 4. Cost Impact of This Stack Choice

| Item | Cost |
|---|---|
| React, Node.js, Express, MySQL | Free — all open source, no licensing fees |
| ORM (Sequelize/Knex) if used | Free — open source |
| Hosting that supports this exact stack | Already selected: ~18,500 LKR/year (Node.js/Python Silver) |

No part of this stack requires a paid license, a separate paid service, or specialized/expensive hosting — it was chosen specifically because it's the most cost-friendly path that still matches the team's existing Node.js/Python familiarity.

---

## 5. What Would Have Changed With a Different Hosting Answer

Noted for completeness — if UHL's cPanel had **not** supported Node.js, the fallback plan was:

| Layer | Fallback |
|---|---|
| Backend | PHP + Laravel (instead of Node/Express) |
| Database | MySQL (unchanged — Laravel pairs with MySQL just as naturally) |
| Hosting | Regular "Unlimited Hosting" plan (~7,500 LKR/year, cheaper) |

This was **not** needed since Node.js support was confirmed on the Silver tier — but it's documented here in case hosting circumstances change in the future.
