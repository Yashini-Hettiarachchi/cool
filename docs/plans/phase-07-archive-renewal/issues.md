# Phase 7 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **Renewal must not overwrite** the old agreement. | Insert a NEW agreement row; set old `status='renewed'`; link via `parent_agreement_id`. Nothing is mutated destructively. |
| 2 | **Renewal chain integrity** — walking `parent_agreement_id`. | Use the recursive CTE from the setup guide; guard against cycles (shouldn't happen, but cap depth). |
| 3 | **Cancel agreement vs cancel job** — different levels. | Agreement cancel = `agreements.status='cancelled'` (Archive). Job cancel = `jobs.status='cancelled'`. Keep endpoints/UI clearly separate. |
| 4 | **Outstanding scheduled jobs** on a cancelled/renewed agreement. | Decide policy: cancelling an agreement should cancel/soft-close its future scheduled jobs. Document and implement consistently. |
| 5 | **Pre-fill correctness** on renew — must copy AC + agreement fields accurately. | Reuse the AS- lookup query that returns customer+AC+agreement; map into the same NewAgreement form. |
