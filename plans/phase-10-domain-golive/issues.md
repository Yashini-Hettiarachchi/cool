# Phase 10 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **DNS propagation delay** after pointing the domain. | Plan a buffer (up to 24–48h); verify with dig/nslookup before UAT. |
| 2 | **SSL not auto-issued** until domain is fully attached & resolving. | Confirm Let's Encrypt issued in cPanel; force HTTPS redirect only after cert is active. |
| 3 | **`/admin` base path** must match final domain config. | Verify Application URL + React `basename` align with the live path. |
| 4 | **Open client items** — SMS wording, exact job card layout, final AS- format. | Resolve all during UAT; these are tracked open items in `05_Overall_Design_Plan.md`. |
| 5 | **Root domain reserved** for future showcase — must not 404 badly. | Root redirects to `/admin` (or a placeholder) until the showcase site exists. |
| 6 | **Real SMS costs** kick in at go-live. | Confirm Text.lk balance/billing; monitor `sms_logs` for failures. |
