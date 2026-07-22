# Phase 4 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **Photo count/size enforced only client-side** is bypassable. | Enforce min 4 / max 5 and 5MB **server-side** in the upload handler and again at the "Complete" transition. Client checks are UX only. |
| 2 | **Large phone photos** exhaust cPanel disk quota. | 5MB cap per file; consider server-side downscale (sharp) if quota tightens. Store outside `public_html`. |
| 3 | **Photos publicly guessable by URL.** | Serve only via authenticated `GET /api/jobs/:id/photos/:photoId`; store under `server/uploads`, never in `client/public`. |
| 4 | **Partial upload then Complete** — fewer than 4 photos slip through. | Re-count photos in DB at the Complete transition, reject if <4. Atomic check. |
| 5 | **Multipart + JWT** — `Authorization` header must survive `multer`. | Auth middleware runs before multer; token in header, not body. |
| 6 | **iOS/Android camera capture quirks** with `capture="environment"`. | Progressive enhancement — plain file input still works; test on real devices during UAT. |
| 7 | **service_type_used decrements counts** — must not over-decrement past agreement allocation. | Application-level check (soft): warn/deny if normal/hp allocation already exhausted. |
| 8 | **Disk write permissions** on cPanel uploads dir. | Ensure the uploads path exists and is writable by the app user; create on boot if missing. |
