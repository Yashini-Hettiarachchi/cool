const express = require('express');
const CustomersController = require('../controllers/customers.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

// Office operations — admin and system_user (not technicians).
router.use(authRequired, requireRole('admin', 'system_user'));

router.get('/', CustomersController.list);
router.get('/search', CustomersController.search);
router.get('/:id', CustomersController.profile);
router.post('/', CustomersController.create);

module.exports = router;
