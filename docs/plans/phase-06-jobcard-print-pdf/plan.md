# Phase 6 — Job Card Print & PDF View ✅

**Goal:** A job card can be opened, printed, and downloaded as a PDF cleanly.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 6).

## Tasks
- [x] ~~`GET /api/jobs/:id/print` — print-friendly HTML~~ → **`GET /api/jobs/:id/card`** returning the card's data, rendered by a React view (see below)
- [x] Add **Download PDF** alongside Print (browser print-to-PDF)
- [x] Clean print CSS (`@media print` hides nav/buttons)
- [ ] Match the client's exact job card template once provided — *still open; layout lives in one component so it can be re-skinned in one place*
- [x] Shows customer details, address, route, AS-, AC info (model/brand/serials), comments

## What was built (2026-07-29)

### Data endpoint, not server-rendered HTML
The plan sketched a print-friendly HTML endpoint. The app is a
token-authenticated SPA with the JWT held **in memory only**, so a plain HTML
page would have to carry the token in the URL to be openable and printable.
`GET /api/jobs/:id/card` returns the data instead and `pages/JobCard.jsx` renders
it, reusing the existing auth path. Same fields, one fewer way to leak a token.

`JobModel.cardData()` is a single read: job + agreement commercials + customer +
AC unit + technician + photo count + **where this visit sits in the series**
("visit 3 of 4", derived from the agreement's non-deleted jobs).

### Printing
`window.print()`, not puppeteer — cPanel shared hosting won't carry a headless
Chrome (issue #1), and every current browser offers "Save as PDF" from the same
dialog. Both buttons open it; the Download PDF button says so in its tooltip and
a hint line sits under the toolbar. `document.title` is swapped to
`JobCard-AS-00042-visit-3` before printing so the suggested filename is right,
and restored on the `afterprint` event.

### Print CSS
`@media print` in `styles.css` drops the dark rail, the sticky topbar, all
buttons (`.no-print`) and pagination, un-offsets `.main`, and flattens the sheet's
card chrome. A4 with 14mm margins; `break-inside: avoid` on sections, signature
block and fields so a label never orphans at a page foot. Animations and
transforms are frozen — a mid-flight fade would otherwise print at whatever
opacity it had reached.

### Reachable from
- Office: **Job Detail → Job card** (`/jobs/:id/card`)
- Technician: **Job Detail → Job card** (same route; all three roles share it, and
  the API still enforces that a technician may only open a job assigned to them)

Sinhala `route` text (issue #4) rides on the existing utf8mb4 path and the app's
system font stack, which resolves to a Sinhala-capable face on Windows/Android.

## Checkpoint
✅ Job card opens and prints; PDF via the browser's Save-as-PDF destination.
⬜ Client's exact template not yet supplied — re-skin `JobCard.jsx` + the `.jc-*`
CSS block when it arrives.
