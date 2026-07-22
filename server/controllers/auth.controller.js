/**
 * Auth controller — login + current-user lookup.
 */
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const AuthController = {
  /**
   * POST /api/auth/login
   * Body: { phone, password }
   * Verifies credentials, checks the account is active, issues a JWT { id, role }.
   */
  async login(req, res, next) {
    try {
      const { phone, password } = req.body || {};
      if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
      }

      const user = await UserModel.findByPhone(phone);
      // Generic message — do not reveal whether the phone exists.
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!user.active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      const ok = await UserModel.verifyPassword(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   * Returns the authenticated user's public profile.
   */
  async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
