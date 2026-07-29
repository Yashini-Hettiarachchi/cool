/**
 * Agreements controller.
 *
 * POST /api/agreements is the "Create Job" flow. In ONE transaction it:
 *   1. reuses or creates the customer (by NIC/phone),
 *   2. creates the AC unit,
 *   3. generates the next AS- number,
 *   4. inserts the agreement (1-year, Normal/H-P counts + period),
 *   5. auto-generates (normal_count + hp_count) scheduled jobs,
 *   6. logs an activation SMS (log-only until Text.lk is enabled).
 *
 * SMS never blocks creation (Phase 2 issue #4): it is sent AFTER commit.
 */
const { pool } = require('../config/db');
const CustomerModel = require('../models/customer.model');
const AcUnitModel = require('../models/acUnit.model');
const AgreementModel = require('../models/agreement.model');
const { nextAgreementNo } = require('../services/numberingService');
const { generateJobs } = require('../services/schedulerService');
const sms = require('../services/smsService');

const PERIODS = [30, 60, 90, 120];

const AgreementsController = {
  /** GET /api/agreements/:number — lookup by AS- (customer + AC + agreement + jobs). */
  async getByNumber(req, res, next) {
    try {
      const agreement = await AgreementModel.findByNumber(req.params.number);
      if (!agreement) return res.status(404).json({ error: 'Agreement not found' });
      const jobs = await AgreementModel.jobs(agreement.id);
      res.json({ agreement, jobs });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/agreements — create customer(if new)+AC+agreement+jobs+activation SMS. */
  async create(req, res, next) {
    const body = req.body || {};
    const { customer = {}, acUnit = {}, agreement = {} } = body;

    const normalCount = Number(agreement.normal_count) || 0;
    const hpCount = Number(agreement.hp_count) || 0;
    const periodDays = Number(agreement.period_days);
    const totalVisits = normalCount + hpCount;

    // --- validation ---
    if (!customer.id && (!customer.name || !customer.phone || !customer.nic)) {
      return res.status(400).json({ error: 'customer name, phone and nic are required for a new customer' });
    }
    if (totalVisits < 1) {
      return res.status(400).json({ error: 'normal_count + hp_count must be at least 1' });
    }
    if (!PERIODS.includes(periodDays)) {
      return res.status(400).json({ error: `period_days must be one of ${PERIODS.join(', ')}` });
    }
    if (agreement.amount_paid === undefined || agreement.amount_paid === null) {
      return res.status(400).json({ error: 'amount_paid is required' });
    }

    const startDate = agreement.start_date || new Date().toISOString().slice(0, 10);
    const createdBy = req.user ? req.user.id : null;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. customer — reuse by id, or find by NIC/phone, or create
      let customerId = customer.id;
      if (!customerId) {
        const existing = await CustomerModel.findByNicOrPhone(customer.nic, customer.phone);
        customerId = existing
          ? existing.id
          : await CustomerModel.create(conn, customer);
      }

      // 2. AC unit
      const acUnitId = await AcUnitModel.create(conn, customerId, acUnit);

      // 3. AS- number (locked within txn)
      const agreementNo = await nextAgreementNo(conn);

      // 4. agreement
      const agreementId = await AgreementModel.create(conn, {
        agreementNo,
        customerId,
        acUnitId,
        normalCount,
        hpCount,
        periodDays,
        price: agreement.price,
        startDate,
        amountPaid: agreement.amount_paid,
        createdBy,
      });

      // 5. jobs
      const jobsCreated = await generateJobs(conn, agreementId, startDate, totalVisits, periodDays);

      // 6. activation SMS — read the recipient on the txn connection, but render
      // and send only after commit. Rendering now hits the DB for the template
      // override, and a second pool connection must never be taken while this
      // transaction still holds one.
      const [custRows] = await conn.query('SELECT name, phone FROM customers WHERE id = ?', [customerId]);
      const cust = custRows[0];

      await conn.commit();

      // send after commit — failure only affects the log status, not the agreement
      const message = await sms.render('activation', { name: cust.name, agreementNo });
      const result = await sms.sendSms(cust.phone, message);
      await sms.logSms(pool, {
        customerId,
        templateType: 'activation',
        message,
        status: result.status,
      });

      const created = await AgreementModel.findByNumber(agreementNo);
      const jobs = await AgreementModel.jobs(agreementId);
      res.status(201).json({ agreement: created, jobs, jobsCreated, sms: result.status });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  },
};

module.exports = AgreementsController;
