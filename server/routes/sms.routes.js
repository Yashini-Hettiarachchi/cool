const express = require('express');
const SmsController = require('../controllers/sms.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { requireRole, adminOnly } = require('../middleware/role.middleware');

const router = express.Router();

const office = requireRole('admin', 'system_user');

router.use(authRequired);

// Reading history / the reminder batch is office work.
router.get('/logs', office, SmsController.logs);
router.get('/reminders/preview', office, SmsController.remindersPreview);
router.get('/templates', office, SmsController.templates);

// Changing the wording customers receive, and spending credits on a test send,
// are admin-only — same bar as pricing.
router.put('/templates/:type', adminOnly, SmsController.saveTemplate);
router.delete('/templates/:type', adminOnly, SmsController.resetTemplate);
router.post('/test', adminOnly, SmsController.test);

module.exports = router;
