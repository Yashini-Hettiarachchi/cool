const express = require('express');
const UsersController = require('../controllers/users.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

const router = express.Router();

// All user-management routes are Admin-only.
router.use(authRequired, adminOnly);

router.get('/', UsersController.list);
router.post('/', UsersController.create);
router.put('/:id', UsersController.update);
router.delete('/:id', UsersController.deactivate);

module.exports = router;
