# Phase 6 — Issues & Risks

| # | Issue | Mitigation |
|---|---|---|
| 1 | **Server-side PDF libs (puppeteer) are heavy** for cPanel shared hosting. | Prefer browser print-to-PDF (`window.print()` + print CSS) as the interim; only add a lightweight lib (pdfkit) if the client needs server-generated PDFs. |
| 2 | **Exact job card layout not provided yet** (open item). | Build to the wireframe structure now; keep layout in one component to re-skin quickly on client sign-off. |
| 3 | **Print CSS leaking app chrome** (nav/buttons). | `@media print` hides everything except the card; test in Chrome/print preview. |
| 4 | **Sinhala route text rendering** in print/PDF. | Ensure utf8mb4 all the way through and a font that covers Sinhala glyphs. |
