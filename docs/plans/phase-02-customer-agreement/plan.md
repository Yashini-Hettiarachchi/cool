# Phase 2 — Customer & Agreement Registration

**Goal:** Register a customer, create an agreement (mix of Normal/H-P visits on a chosen period), get an `AS-` number, auto-generate the year's jobs, and log an activation SMS.

Source: `design-plans/08_Implementation_Plan_Step_By_Step.md` (Phase 2).

## Tasks
- [x] Models: `customer.model.js`, `acUnit.model.js` (model/brand/serial_indoor/serial_outdoor), `agreement.model.js` (normal_count/hp_count/period_days/price)
- [x] `GET /api/customers/search` — by NIC / phone / AS-
- [x] `POST /api/customers` — create, checking existing NIC/phone first
- [x] `services/numberingService.js` — next `AS-` (zero-padded, global, never reused)
- [x] `POST /api/agreements` — creates agreement + AC unit link + AS-; pulls default price from `pricing`, editable
- [x] `services/schedulerService.js` — generate `(normal_count + hp_count)` job rows, spaced `period_days` apart from `start_date`
- [x] `services/smsService.js` — Text.lk wrapper; wire the Activation SMS on agreement creation
- [x] Frontend: `CustomerSearch.jsx`, `CustomerProfile.jsx`, `NewAgreement.jsx` (Model/Brand/Serial in+out, Normal count, H/P count, Period 30/60/90/120 presets, Price, "+ Add AC")

## Checkpoint
Register a new customer → create an agreement with mixed Normal/H-P visits on a chosen period → receive an `AS-` number → see the year's jobs generated → activation SMS logged in `sms_logs`.
