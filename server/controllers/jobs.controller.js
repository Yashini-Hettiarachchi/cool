/**
 * Jobs controller — calendar reads + admin lifecycle actions + technician workflow.
 */
const fs = require('fs');
const path = require('path');
const JobModel = require('../models/job.model');
const { pool } = require('../config/db');
const sms = require('../services/smsService');

const MAX_PHOTOS = 5;

/**
 * Completion SMS for a just-approved visit, recorded in sms_logs.
 *
 * Returns the logged status and NEVER throws: the approval row is already
 * committed by the time this runs, so an SMS problem must not turn a successful
 * approval into an error response (same rule as the activation SMS in
 * agreements.controller). A customer with no phone on file is logged as
 * 'skipped-no-phone' rather than silently dropped, so the office can see that
 * they were not notified.
 */
async function notifyCompletion(job) {
  try {
    const message = await sms.render('completion', {
      name: job.customer_name,
      agreementNo: job.agreement_no,
    });
    const status = job.phone ? (await sms.sendSms(job.phone, message)).status : 'skipped-no-phone';
    await sms.logSms(pool, {
      customerId: job.customer_id,
      jobId: job.id,
      templateType: 'completion',
      message,
      status,
    });
    return status;
  } catch (err) {
    console.error(`[sms:completion] job ${job.id}:`, err.message);
    return 'failed';
  }
}

const JobsController = {
  /** GET /api/jobs?month=YYYY-MM  or  ?date=YYYY-MM-DD */
  async list(req, res, next) {
    try {
      const { month, date } = req.query;
      if (date) return res.json({ jobs: await JobModel.listByDate(date) });
      if (month) return res.json({ jobs: await JobModel.listByMonth(month) });
      return res.status(400).json({ error: 'Provide ?month=YYYY-MM or ?date=YYYY-MM-DD' });
    } catch (err) { next(err); }
  },

  /** GET /api/jobs/technicians — active technicians for assignment. */
  async technicians(req, res, next) {
    try { res.json({ technicians: await JobModel.listTechnicians() }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/stats — dashboard overview counts. */
  async stats(req, res, next) {
    try { res.json({ stats: await JobModel.overview() }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/upcoming?limit= — next scheduled visits. */
  async upcoming(req, res, next) {
    try { res.json({ jobs: await JobModel.upcoming(req.query.limit || 6) }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/to-assign — upcoming active visits for the Assignments board. */
  async toAssign(req, res, next) {
    try { res.json({ jobs: await JobModel.listToAssign() }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/complete-requests?status=approved — pending (default) or approved completions. */
  async completeRequests(req, res, next) {
    try {
      const confirmed = req.query.status === 'approved';
      res.json({ jobs: await JobModel.listCompletions(confirmed) });
    } catch (err) { next(err); }
  },

  /**
   * PATCH /api/jobs/:id/confirm — approve a completed job.
   *
   * Approval is the moment the customer hears about the work, so the completion
   * SMS fires HERE and not on the technician's Complete tap — a completion that
   * gets reviewed and rejected never reaches them. Only a genuine
   * FALSE→TRUE transition notifies, so re-approving is silent.
   */
  async confirm(req, res, next) {
    try {
      const existing = await JobModel.detail(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Job not found' });
      if (existing.status !== 'completed') {
        return res.status(422).json({ error: 'Only a completed job can be approved' });
      }

      const { job, justConfirmed } = await JobModel.confirm(req.params.id);
      const smsStatus = justConfirmed ? await notifyCompletion(job) : 'already-approved';
      res.json({ job, sms: smsStatus });
    } catch (err) { next(err); }
  },

  /** GET /api/jobs/deleted */
  async deleted(req, res, next) {
    try { res.json({ jobs: await JobModel.listDeleted() }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/cancelled */
  async cancelled(req, res, next) {
    try { res.json({ jobs: await JobModel.listCancelled() }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/:id */
  async detail(req, res, next) {
    try {
      const job = await JobModel.detail(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      res.json({ job });
    } catch (err) { next(err); }
  },

  /**
   * GET /api/jobs/:id/card — everything the printable job card shows.
   *
   * A data endpoint rather than the server-rendered HTML the phase plan sketched:
   * the app is a token-authenticated SPA, so an HTML page would have to carry the
   * JWT in the URL to be printable. The React card renders the same fields and
   * prints through the browser (phase-06 issue #1 — no puppeteer on shared
   * hosting).
   */
  async card(req, res, next) {
    try {
      const card = await JobModel.cardData(req.params.id);
      if (!card) return res.status(404).json({ error: 'Job not found' });
      res.json({ card, photos: await JobModel.listPhotos(req.params.id) });
    } catch (err) { next(err); }
  },

  /** PATCH /api/jobs/:id/assign  { technician_id } */
  async assign(req, res, next) {
    try {
      const { technician_id } = req.body || {};
      if (!technician_id) return res.status(400).json({ error: 'technician_id is required' });
      res.json({ job: await JobModel.assign(req.params.id, technician_id) });
    } catch (err) { next(err); }
  },

  /** PATCH /api/jobs/:id/postpone  { days, reason } */
  async postpone(req, res, next) {
    try {
      const days = Number(req.body?.days);
      if (!days || days < 1) return res.status(400).json({ error: 'days must be a positive number' });
      res.json({ job: await JobModel.postpone(req.params.id, days, req.body?.reason) });
    } catch (err) { next(err); }
  },

  /** PATCH /api/jobs/:id/cancel  { reason } */
  async cancel(req, res, next) {
    try { res.json({ job: await JobModel.cancel(req.params.id, req.body?.reason) }); }
    catch (err) { next(err); }
  },

  /** PATCH /api/jobs/:id/soft-delete */
  async softDelete(req, res, next) {
    try { res.json({ job: await JobModel.softDelete(req.params.id) }); }
    catch (err) { next(err); }
  },

  /** PATCH /api/jobs/:id/comment  { comments } */
  async comment(req, res, next) {
    try { res.json({ job: await JobModel.addComment(req.params.id, req.body?.comments) }); }
    catch (err) { next(err); }
  },

  // ---- Technician (Phase 4) ----

  /** GET /api/jobs/mine/today — today's jobs assigned to the caller. */
  async myToday(req, res, next) {
    try { res.json({ jobs: await JobModel.myTodayJobs(req.user.id) }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/mine — every visit assigned to the caller (open first, then done). */
  async mine(req, res, next) {
    try { res.json({ jobs: await JobModel.myJobs(req.user.id) }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/by-agreement/:as_number — all visits under an AS-. */
  async byAgreement(req, res, next) {
    try {
      const jobs = await JobModel.listByAgreementNo(req.params.as_number);
      if (!jobs.length) return res.status(404).json({ error: 'No jobs found for that AS- number' });
      res.json({ jobs });
    } catch (err) { next(err); }
  },

  /**
   * PATCH /api/jobs/:id/status  { status, service_type_used }
   * status: 'in_progress' | 'completed'. Completing requires service_type_used
   * (normal|hp) and sends the job to the approval queue (admin_confirmed=FALSE).
   */
  async status(req, res, next) {
    try {
      const { status, service_type_used } = req.body || {};
      if (!['in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: "status must be 'in_progress' or 'completed'" });
      }
      if (status === 'completed' && !['normal', 'hp'].includes(service_type_used)) {
        return res.status(422).json({ error: 'service_type_used (normal|hp) is required to complete a job' });
      }
      res.json({ job: await JobModel.updateStatus(req.params.id, status, service_type_used || null) });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/jobs/:id/photos  (multipart, field "photos")
   * Enforces a hard cap of MAX_PHOTOS total; rolls back the just-written files if exceeded.
   */
  async uploadPhotos(req, res, next) {
    try {
      const jobId = req.params.id;
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ error: 'No photos uploaded' });

      const existing = await JobModel.countPhotos(jobId);
      if (existing + files.length > MAX_PHOTOS) {
        files.forEach((f) => fs.unlink(f.path, () => {}));
        return res.status(422).json({ error: `Max ${MAX_PHOTOS} photos per job (already ${existing})` });
      }

      for (const f of files) {
        await JobModel.addPhoto(jobId, `job_photos/${f.filename}`, req.user.id);
      }
      res.status(201).json({ photos: await JobModel.listPhotos(jobId) });
    } catch (err) { next(err); }
  },

  /** GET /api/jobs/:id/photos — photo metadata list. */
  async photos(req, res, next) {
    try { res.json({ photos: await JobModel.listPhotos(req.params.id) }); }
    catch (err) { next(err); }
  },

  /** GET /api/jobs/:id/photos/:photoId — authenticated file stream (not public static). */
  async photoFile(req, res, next) {
    try {
      const row = await JobModel.getPhoto(req.params.id, req.params.photoId);
      if (!row) return res.status(404).json({ error: 'Photo not found' });
      const abs = path.join(__dirname, '..', 'uploads', row.photo_path);
      res.sendFile(abs, (err) => { if (err && !res.headersSent) res.status(404).json({ error: 'File missing' }); });
    } catch (err) { next(err); }
  },
};

module.exports = JobsController;
