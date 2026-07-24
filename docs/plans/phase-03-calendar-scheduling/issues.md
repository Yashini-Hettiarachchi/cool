# Phase 3 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **Deleted vs Cancelled confusion** — they look similar but are semantically different. | `is_deleted` = mistake correction (any status); `status='cancelled'` = customer-driven with reason. Deleted Jobs view filters `is_deleted=TRUE`; Cancellations view filters `status='cancelled' AND is_deleted=FALSE`. Never hard-delete. |
| 2 | **Timezone drift** on `scheduled_date` — server vs client date mismatch. | Store/compare as `DATE` (no time); do date math in SQL (`DATE_ADD`) or a single tz-safe util. Avoid `new Date()` string parsing across tz. |
| 3 | **Postpone cascade** — should later jobs shift too? | Per design, postpone shifts only that job. Document explicitly; do not auto-cascade. |
| 4 | **Calendar performance** — querying whole month. | Index on `scheduled_date` (already in schema); query by month range, exclude `is_deleted`. |
| 5 | **Status color mapping** must match wireframe exactly. | Active/scheduled=red, postponed=orange, complete=green. Centralize the mapping in one component/constant. |
| 6 | **Assign to inactive technician.** | Filter technician dropdown to `active=TRUE, role='technician'`. |
