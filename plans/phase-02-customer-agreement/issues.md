# Phase 2 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **AS- number race condition** — two concurrent agreement creations could grab the same number. | Generate the number inside a transaction, or rely on a DB unique constraint + retry; consider `SELECT ... FOR UPDATE` on the max. Low concurrency expected but guard anyway. |
| 2 | **AS- format still open** (client wireframes hint at a date-encoded string like `AS260718...`). | Keep `AS-00001` for now; isolate format logic in `numberingService.js` so it's a one-file change if the client confirms otherwise. |
| 3 | **Duplicate customer** — same NIC/phone re-registered. | `POST /api/customers` checks NIC **and** phone first; phone is UNIQUE at DB level as a backstop. Surface "customer exists" with a link to their profile. |
| 4 | **Text.lk failure shouldn't block agreement creation.** | Send SMS after commit; log failures to `sms_logs` with `status='failed'` and never throw out of the create flow. |
| 5 | **Period/counts producing 0 jobs** (both counts 0). | Validate `normal_count + hp_count >= 1` and `period_days ∈ {30,60,90,120}` server-side. |
| 6 | **Multiple ACs per customer** — one agreement each, "+ Add AC" flow. | Each AC → its own `ac_units` row → its own agreement + AS-. Keep the form able to loop. |
| 7 | **amount_paid vs price** confusion. | `price` = agreed contract price (default from pricing table); `amount_paid` = what was actually collected. Keep both explicit in the form. |
| 8 | **Text.lk credentials / sender ID** not yet provisioned. | Stub the service behind an env flag (`SMS_ENABLED`); log-only mode until real API key is available. |
