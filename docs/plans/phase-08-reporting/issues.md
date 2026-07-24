# Phase 8 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **Must count only admin-confirmed completions**, not technician-marked. | Query filters `status='completed' AND admin_confirmed=TRUE`. Matches reporting queries in `07_Database_Setup_Guide_MySQL.md`. |
| 2 | **Date range boundaries** (inclusive day/week/month) off-by-one. | Compute ranges in Asia/Colombo; use `BETWEEN start 00:00 AND end 23:59:59` or half-open ranges consistently. |
| 3 | **Charting adds bundle weight.** | Start with a simple table; add a lightweight chart (recharts) only if the client wants a visual. |
| 4 | **Access control** — reports available to Admin + System User, not technicians. | Guard route with `requireRole('admin','system_user')`. |
