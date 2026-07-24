/**
 * Demo data seeder — 5 customers covering every scenario in the system.
 *
 * Idempotent: all demo rows use phone numbers starting "07999", so re-running
 * wipes the previous demo set (and only that) before re-inserting. Real data
 * (e.g. AS-00001 / Nimal Silva) is never touched.
 *
 * Run:  npm run seed:demo   (from server/)
 *
 * Scenarios covered:
 *   1. Fresh agreement — all visits scheduled & UNASSIGNED (fills Assignments board)
 *   2. Assigned + one visit IN PROGRESS today (fills a technician's "My Jobs")
 *   3. Completed visit awaiting approval — admin_confirmed=FALSE (fills approval queue)
 *   4. Confirmed-complete (this month) + a POSTPONED visit
 *   5. Long-time customer, TWO AC units, a RENEWAL chain, an archived (cancelled)
 *      agreement, a CANCELLED job (Cancellations view) and a SOFT-DELETED job
 *      (Deleted Jobs view)
 *
 * Note: photo rows point at placeholder paths (no real files on disk), so photo
 * counts/queues populate but thumbnails 404 — fine for demo/testing.
 */
require('dotenv').config();
const { pool } = require('../config/db');

const NORMAL = 3500;
const HP = 5000;

// ---- date helpers (plain YYYY-MM-DD / DATETIME strings) ----
const today = new Date();
const isoDate = (d) => d.toISOString().slice(0, 10);
const isoDT = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return isoDate(d); };
const dtDaysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return isoDT(d); };
const dtYearsAgo = (n) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return isoDT(d); };
const dateYearsAgo = (n) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return isoDate(d); };

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // --- who to reference ---
    const [[admin]] = await conn.query("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1");
    const adminId = admin ? admin.id : null;
    const [techRows] = await conn.query("SELECT id, name FROM users WHERE role='technician' AND active=TRUE ORDER BY id");
    if (techRows.length < 1) throw new Error('Need at least one active technician — run seed:admin / add a technician first.');
    const techA = techRows[0].id;
    const techB = (techRows[1] || techRows[0]).id;

    // --- wipe previous demo set (phones 07999*) in FK-safe order ---
    const [demoCust] = await conn.query("SELECT id FROM customers WHERE phone LIKE '07999%'");
    const cids = demoCust.map((r) => r.id);
    if (cids.length) {
      const [ag] = await conn.query('SELECT id FROM agreements WHERE customer_id IN (?)', [cids]);
      const aids = ag.map((r) => r.id);
      const [jb] = aids.length ? await conn.query('SELECT id FROM jobs WHERE agreement_id IN (?)', [aids]) : [[]];
      const jids = jb.map((r) => r.id);
      if (jids.length) {
        await conn.query('DELETE FROM sms_logs WHERE job_id IN (?)', [jids]);
        await conn.query('DELETE FROM job_photos WHERE job_id IN (?)', [jids]);
      }
      await conn.query('DELETE FROM sms_logs WHERE customer_id IN (?)', [cids]);
      if (aids.length) {
        await conn.query('DELETE FROM jobs WHERE agreement_id IN (?)', [aids]);
        await conn.query('DELETE FROM agreements WHERE parent_agreement_id IN (?)', [aids]); // children first
        await conn.query('DELETE FROM agreements WHERE id IN (?)', [aids]);
      }
      await conn.query('DELETE FROM ac_units WHERE customer_id IN (?)', [cids]);
      await conn.query('DELETE FROM customers WHERE id IN (?)', [cids]);
    }

    // --- AS- serial continues after the current global max ---
    const [[{ maxno }]] = await conn.query(
      "SELECT COALESCE(MAX(CAST(REPLACE(agreement_no,'AS-','') AS UNSIGNED)),0) AS maxno FROM agreements"
    );
    let serial = Number(maxno);
    const nextAS = () => `AS-${String(++serial).padStart(5, '0')}`;

    // --- small insert helpers ---
    const addCustomer = async (c) => {
      const [r] = await conn.query(
        'INSERT INTO customers (name, phone, nic, address, route, created_at) VALUES (?,?,?,?,?,?)',
        [c.name, c.phone, c.nic, c.address, c.route, c.createdAt || isoDT(today)]
      );
      return r.insertId;
    };
    const addAC = async (customerId, ac) => {
      const [r] = await conn.query(
        'INSERT INTO ac_units (customer_id, model, brand, serial_indoor, serial_outdoor, install_notes) VALUES (?,?,?,?,?,?)',
        [customerId, ac.model, ac.brand, ac.serialIn, ac.serialOut, ac.notes || null]
      );
      return r.insertId;
    };
    const addAgreement = async (a) => {
      const price = a.normal * NORMAL + a.hp * HP;
      const [r] = await conn.query(
        `INSERT INTO agreements
           (agreement_no, customer_id, ac_unit_id, normal_count, hp_count, period_days,
            price, start_date, end_date, amount_paid, status, parent_agreement_id, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [a.no, a.customerId, a.acUnitId, a.normal, a.hp, a.period, price,
         a.start, a.end, price, a.status || 'active', a.parent || null, adminId, a.createdAt || a.start]
      );
      return r.insertId;
    };
    const addJob = async (agreementId, o = {}) => {
      const [r] = await conn.query(
        `INSERT INTO jobs
           (agreement_id, scheduled_date, status, technician_id, service_type_used,
            admin_confirmed, is_deleted, postponed_from, postpone_days, postpone_reason,
            cancel_reason, comments, completed_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [agreementId, o.date, o.status || 'scheduled', o.tech || null, o.type || null,
         o.confirmed ? 1 : 0, o.deleted ? 1 : 0, o.postponedFrom || null, o.postponeDays || null,
         o.postponeReason || null, o.cancelReason || null, o.comments || null, o.completedAt || null]
      );
      return r.insertId;
    };
    const addPhotos = async (jobId, n) => {
      for (let i = 1; i <= n; i++) {
        await conn.query(
          'INSERT INTO job_photos (job_id, photo_path, uploaded_by) VALUES (?,?,?)',
          [jobId, `job_photos/demo_job${jobId}_${i}.jpg`, techA]
        );
      }
    };
    const addSms = async (customerId, jobId, type, message) => {
      await conn.query(
        'INSERT INTO sms_logs (customer_id, job_id, template_type, message, status) VALUES (?,?,?,?,?)',
        [customerId, jobId, type, message, 'logged']
      );
    };

    // ============================================================
    // 1. Fresh agreement — all visits scheduled & UNASSIGNED
    // ============================================================
    {
      const cid = await addCustomer({ name: 'Saman Kumara', phone: '0799900001', nic: '901234567V', address: '12 Lake Rd, Kandy', route: 'Kandy' });
      const ac = await addAC(cid, { model: 'FTKF35', brand: 'Daikin', serialIn: 'IN-SK-001', serialOut: 'OUT-SK-001' });
      const ag = await addAgreement({ no: nextAS(), customerId: cid, acUnitId: ac, normal: 2, hp: 2, period: 90, start: addDays(0), end: addDays(365) });
      const jobs = [];
      for (let i = 0; i < 4; i++) jobs.push(await addJob(ag, { date: addDays(i * 90), status: 'scheduled' }));
      await addSms(cid, jobs[0], 'activation', 'Your Highcool service agreement is now active. First visit scheduled.');
    }

    // ============================================================
    // 2. Assigned + one visit IN PROGRESS today
    // ============================================================
    {
      const cid = await addCustomer({ name: 'Dilani Perera', phone: '0799900002', nic: '885550123V', address: '48 Galle Rd, Colombo 03', route: 'Colombo' });
      const ac = await addAC(cid, { model: 'MSZ-AP', brand: 'Mitsubishi', serialIn: 'IN-DP-002', serialOut: 'OUT-DP-002' });
      const ag = await addAgreement({ no: nextAS(), customerId: cid, acUnitId: ac, normal: 3, hp: 1, period: 90, start: addDays(-5), end: addDays(360) });
      const j1 = await addJob(ag, { date: addDays(0), status: 'in_progress', tech: techA });
      await addPhotos(j1, 2);
      await addJob(ag, { date: addDays(90), status: 'scheduled', tech: techA });
      await addJob(ag, { date: addDays(180), status: 'scheduled', tech: techA });
      await addJob(ag, { date: addDays(270), status: 'scheduled', tech: techA });
    }

    // ============================================================
    // 3. Completed visit awaiting approval (approval queue)
    // ============================================================
    {
      const cid = await addCustomer({ name: 'Ruwan Fernando', phone: '0799900003', nic: '921112223V', address: '7 Temple St, Galle', route: 'Galle' });
      const ac = await addAC(cid, { model: 'Inverter-X', brand: 'LG', serialIn: 'IN-RF-003', serialOut: 'OUT-RF-003' });
      const ag = await addAgreement({ no: nextAS(), customerId: cid, acUnitId: ac, normal: 2, hp: 2, period: 90, start: addDays(-30), end: addDays(335) });
      const done = await addJob(ag, { date: addDays(-1), status: 'completed', tech: techB, type: 'normal', confirmed: false, completedAt: dtDaysAgo(1), comments: 'Cleaned filters, gas ok. Awaiting office confirmation.' });
      await addPhotos(done, 4);
      await addJob(ag, { date: addDays(60), status: 'scheduled', tech: techB });
      await addJob(ag, { date: addDays(150), status: 'scheduled' });
      await addJob(ag, { date: addDays(240), status: 'scheduled' });
    }

    // ============================================================
    // 4. Confirmed-complete (this month) + a POSTPONED visit
    // ============================================================
    {
      const cid = await addCustomer({ name: 'Nadeesha Silva', phone: '0799900004', nic: '937778889V', address: '90 Hill St, Nuwara Eliya', route: 'Nuwara Eliya' });
      const ac = await addAC(cid, { model: 'AR12', brand: 'Samsung', serialIn: 'IN-NS-004', serialOut: 'OUT-NS-004' });
      const ag = await addAgreement({ no: nextAS(), customerId: cid, acUnitId: ac, normal: 2, hp: 2, period: 90, start: addDays(-40), end: addDays(325) });
      const done = await addJob(ag, { date: addDays(-8), status: 'completed', tech: techA, type: 'hp', confirmed: true, completedAt: dtDaysAgo(8), comments: 'H/P service done, confirmed by office.' });
      await addPhotos(done, 5);
      await addSms(cid, done, 'completion', 'Your Highcool H/P service is complete. Thank you!');
      // postponed visit
      await addJob(ag, { date: addDays(12), status: 'postponed', tech: techA, postponedFrom: addDays(2), postponeDays: 10, postponeReason: 'Customer not available on original date' });
      await addJob(ag, { date: addDays(102), status: 'scheduled', tech: techA });
      await addJob(ag, { date: addDays(192), status: 'scheduled' });
    }

    // ============================================================
    // 5. Loyalty + 2 ACs + renewal chain + archived agreement
    //    + cancelled job (Cancellations) + soft-deleted job (Deleted Jobs)
    // ============================================================
    {
      const cid = await addCustomer({ name: 'Chaminda Jayasuriya', phone: '0799900005', nic: '803334445V', address: '25 Marine Dr, Matara', route: 'Matara', createdAt: dtYearsAgo(3) });
      const acA = await addAC(cid, { model: 'FTKF50', brand: 'Daikin', serialIn: 'IN-CJ-005A', serialOut: 'OUT-CJ-005A', notes: 'Living room' });
      const acB = await addAC(cid, { model: 'MSZ-HR', brand: 'Mitsubishi', serialIn: 'IN-CJ-005B', serialOut: 'OUT-CJ-005B', notes: 'Bedroom' });

      // Old agreement on AC A (now 'renewed'), then its active renewal child
      const oldAg = await addAgreement({ no: nextAS(), customerId: cid, acUnitId: acA, normal: 2, hp: 2, period: 90, start: dateYearsAgo(1), end: addDays(-5), status: 'renewed', createdAt: dtYearsAgo(1) });
      const oldDone = await addJob(oldAg, { date: addDays(-200), status: 'completed', tech: techA, type: 'normal', confirmed: true, completedAt: dtDaysAgo(200) });
      await addPhotos(oldDone, 4);

      const renewAg = await addAgreement({ no: nextAS(), customerId: cid, acUnitId: acA, normal: 2, hp: 2, period: 90, start: addDays(-4), end: addDays(361), status: 'active', parent: oldAg });
      await addJob(renewAg, { date: addDays(20), status: 'scheduled', tech: techA });
      await addJob(renewAg, { date: addDays(110), status: 'scheduled' });
      // soft-deleted job (mistake) → Deleted Jobs view
      await addJob(renewAg, { date: addDays(200), status: 'scheduled', deleted: true, comments: 'Created in error — soft-deleted.' });

      // Archived (cancelled) agreement on AC B + a cancelled job → Cancellations view
      const cancAg = await addAgreement({ no: nextAS(), customerId: cid, acUnitId: acB, normal: 1, hp: 1, period: 120, start: addDays(-60), end: addDays(305), status: 'cancelled' });
      await addJob(cancAg, { date: addDays(15), status: 'cancelled', cancelReason: 'Customer moved out of service area' });
    }

    await conn.commit();

    // --- summary ---
    const [[c]] = await conn.query("SELECT COUNT(*) n FROM customers WHERE phone LIKE '07999%'");
    const [[a]] = await conn.query("SELECT COUNT(*) n FROM agreements WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '07999%')");
    const [[j]] = await conn.query("SELECT COUNT(*) n FROM jobs WHERE agreement_id IN (SELECT id FROM agreements WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '07999%'))");
    console.log(`✅ Demo data seeded: ${c.n} customers, ${a.n} agreements, ${j.n} jobs (AS- up to AS-${String(serial).padStart(5, '0')}).`);
    console.log('   Scenarios: unassigned board · in-progress today · approval queue · confirmed+postponed · renewal/archive/cancelled/deleted.');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Demo seed failed (rolled back):', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
