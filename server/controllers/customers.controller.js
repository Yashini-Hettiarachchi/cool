/**
 * Customers controller — search, profile, and standalone create.
 * (Agreement creation also creates a customer if needed — see agreements.controller.)
 */
const CustomerModel = require('../models/customer.model');
const { pool } = require('../config/db');

const CustomersController = {
  /** GET /api/customers — all customers (default listing). */
  async list(req, res, next) {
    try {
      res.json({ customers: await CustomerModel.listAll() });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/customers/search?q= — by NIC / phone / name / AS-. */
  async search(req, res, next) {
    try {
      const q = (req.query.q || '').trim();
      if (!q) return res.json({ customers: [] });
      const customers = await CustomerModel.search(q);
      res.json({ customers });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/customers/:id — full profile (customer + AC units + agreements). */
  async profile(req, res, next) {
    try {
      const data = await CustomerModel.profile(req.params.id);
      if (!data) return res.status(404).json({ error: 'Customer not found' });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/customers — create a customer (rejects duplicate NIC/phone). */
  async create(req, res, next) {
    try {
      const { name, phone, nic, address, route } = req.body || {};
      if (!name || !phone || !nic) {
        return res.status(400).json({ error: 'name, phone and nic are required' });
      }
      const existing = await CustomerModel.findByNicOrPhone(nic, phone);
      if (existing) {
        return res.status(409).json({ error: 'A customer with this NIC or phone already exists', customer: existing });
      }
      const id = await CustomerModel.create(pool, { name, phone, nic, address, route });
      const customer = await CustomerModel.findById(id);
      res.status(201).json({ customer });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = CustomersController;
