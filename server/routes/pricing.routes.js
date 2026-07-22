const express = require('express');
const PricingController = require('../controllers/pricing.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

const router = express.Router();

// Pricing management is Admin-only.
router.use(authRequired, adminOnly);

router.get('/', PricingController.list);
router.put('/', PricingController.upsert);

module.exports = router;
