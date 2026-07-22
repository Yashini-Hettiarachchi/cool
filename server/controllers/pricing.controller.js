/**
 * Pricing controller (Admin-only) — default Normal / H-P prices.
 */
const PricingModel = require('../models/pricing.model');

const VALID_TYPES = ['normal', 'hp'];

const PricingController = {
  /** GET /api/pricing — all pricing rows. */
  async list(req, res, next) {
    try {
      const pricing = await PricingModel.all();
      res.json({ pricing });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/pricing — set a price. Body: { service_type, price }. */
  async upsert(req, res, next) {
    try {
      const { service_type, price } = req.body || {};

      if (!VALID_TYPES.includes(service_type)) {
        return res.status(400).json({ error: `service_type must be one of: ${VALID_TYPES.join(', ')}` });
      }
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ error: 'price must be a non-negative number' });
      }

      const row = await PricingModel.upsert(service_type, numericPrice);
      res.json({ pricing: row });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = PricingController;
