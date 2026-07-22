const express = require('express');
const JobsController = require('../controllers/jobs.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authRequired, requireRole('admin', 'system_user'));

// Static paths BEFORE the /:id param route.
router.get('/technicians', JobsController.technicians);
router.get('/deleted', JobsController.deleted);
router.get('/cancelled', JobsController.cancelled);
router.get('/', JobsController.list);
router.get('/:id', JobsController.detail);

router.patch('/:id/assign', JobsController.assign);
router.patch('/:id/postpone', JobsController.postpone);
router.patch('/:id/cancel', JobsController.cancel);
router.patch('/:id/soft-delete', JobsController.softDelete);
router.patch('/:id/comment', JobsController.comment);

module.exports = router;
