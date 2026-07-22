/**
 * Users controller (Admin-only) — manage system_user & technician accounts.
 * Admins are created only via the seed script, not through this API.
 */
const UserModel = require('../models/user.model');

const MANAGEABLE_ROLES = ['system_user', 'technician'];

const UsersController = {
  /** GET /api/users — list all users (optional ?role= filter). */
  async list(req, res, next) {
    try {
      const { role } = req.query;
      const users = await UserModel.list(role ? { role } : {});
      res.json({ users });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/users — create a system_user or technician. */
  async create(req, res, next) {
    try {
      const { name, phone, role, password } = req.body || {};

      if (!name || !phone || !role || !password) {
        return res.status(400).json({ error: 'name, phone, role and password are required' });
      }
      if (!MANAGEABLE_ROLES.includes(role)) {
        return res.status(400).json({ error: `role must be one of: ${MANAGEABLE_ROLES.join(', ')}` });
      }

      const existing = await UserModel.findByPhone(phone);
      if (existing) {
        return res.status(409).json({ error: 'A user with this phone already exists' });
      }

      const user = await UserModel.create({ name, phone, role, password });
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/users/:id — update name/phone/role/active/password. */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, phone, role, active, password } = req.body || {};

      const target = await UserModel.findById(id);
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.role === 'admin') {
        return res.status(403).json({ error: 'Admin accounts cannot be edited via this API' });
      }
      if (role !== undefined && !MANAGEABLE_ROLES.includes(role)) {
        return res.status(400).json({ error: `role must be one of: ${MANAGEABLE_ROLES.join(', ')}` });
      }

      const user = await UserModel.update(id, { name, phone, role, active, password });
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/users/:id — soft-delete (deactivate). */
  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      const target = await UserModel.findById(id);
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.role === 'admin') {
        return res.status(403).json({ error: 'Admin accounts cannot be deactivated via this API' });
      }
      const user = await UserModel.deactivate(id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UsersController;
