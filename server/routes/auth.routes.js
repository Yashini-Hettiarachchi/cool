const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/me', authRequired, AuthController.me);

module.exports = router;
