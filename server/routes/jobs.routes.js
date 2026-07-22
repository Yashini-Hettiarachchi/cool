const express = require('express');
const JobsController = require('../controllers/jobs.controller');
const JobModel = require('../models/job.model');
const { authRequired } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { uploadPhotos } = require('../config/upload');

const router = express.Router();

const office = requireRole('admin', 'system_user');
const anyRole = requireRole('admin', 'system_user', 'technician');

/**
 * Ownership guard for technician mutations: a technician may only act on jobs
 * assigned to them. Office roles (admin/system_user) always pass through.
 */
async function ownsJob(req, res, next) {
  try {
    if (req.user.role !== 'technician') return next();
    if (await JobModel.isOwnedBy(req.params.id, req.user.id)) return next();
    return res.status(403).json({ error: 'This job is not assigned to you' });
  } catch (err) { next(err); }
}

router.use(authRequired);

// --- Technician workflow (static paths first) ---
router.get('/mine/today', requireRole('technician', 'admin', 'system_user'), JobsController.myToday);
router.get('/by-agreement/:as_number', anyRole, JobsController.byAgreement);

// --- Office reads ---
router.get('/technicians', office, JobsController.technicians);
router.get('/stats', office, JobsController.stats);
router.get('/upcoming', office, JobsController.upcoming);
router.get('/deleted', office, JobsController.deleted);
router.get('/cancelled', office, JobsController.cancelled);
router.get('/', office, JobsController.list);

// --- Single job: readable by office + assigned technician ---
router.get('/:id', anyRole, ownsJob, JobsController.detail);
router.get('/:id/photos', anyRole, ownsJob, JobsController.photos);
router.get('/:id/photos/:photoId', anyRole, ownsJob, JobsController.photoFile);

// --- Technician mutations (assigned-only; office bypasses ownsJob) ---
router.patch('/:id/status', anyRole, ownsJob, JobsController.status);
router.post('/:id/photos', anyRole, ownsJob, uploadPhotos, JobsController.uploadPhotos);
router.patch('/:id/comment', anyRole, ownsJob, JobsController.comment);

// --- Office lifecycle actions ---
router.patch('/:id/assign', office, JobsController.assign);
router.patch('/:id/postpone', office, JobsController.postpone);
router.patch('/:id/cancel', office, JobsController.cancel);
router.patch('/:id/soft-delete', office, JobsController.softDelete);

module.exports = router;
