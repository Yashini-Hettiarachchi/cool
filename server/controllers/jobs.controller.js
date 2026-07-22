/**
 * Jobs controller — calendar reads + admin lifecycle actions.
 * Guarded admin + system_user (technician actions come in Phase 4).
 */
const JobModel = require('../models/job.model');

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
};

module.exports = JobsController;
