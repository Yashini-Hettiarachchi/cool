const express = require('express');
const AgreementsController = require('../controllers/agreements.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authRequired, requireRole('admin', 'system_user'));

router.get('/:number', AgreementsController.getByNumber);
router.post('/', AgreementsController.create);

module.exports = router;
