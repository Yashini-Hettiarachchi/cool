/**
 * Role-based route guards. Must run AFTER authRequired (needs req.user).
 *
 *   requireRole('admin')                  → admin only
 *   requireRole('admin','system_user')    → either role
 *   adminOnly                             → shorthand for /users and /pricing
 */
function requireRole(...allowed) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

const adminOnly = requireRole('admin');

module.exports = { requireRole, adminOnly };
