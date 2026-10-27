const { verifyToken } = require('../utils/token');
const pool = require('../config/db');

// Reads "Authorization: Bearer <token>", verifies it, and attaches the
// decoded { userId, role } to req.user for downstream handlers.
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Usage: router.get('/x', authenticate, authorize('admin'), handler)
// Must run after `authenticate` so req.user is already set.
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

// Checks that the authenticated vendor has passed KYC verification.
// Must run after `authenticate` and `authorize('vendor')`.
const requireVerifiedVendor = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT is_verified FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    if (!rows.length || !rows[0].is_verified) {
      return res.status(403).json({
        message: 'Your vendor account requires KYC verification before you can perform this action. Please complete your KYC at the Vendor KYC page.',
        code: 'KYC_REQUIRED',
      });
    }
    next();
  } catch (err) {
    console.error('requireVerifiedVendor error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { authenticate, authorize, requireVerifiedVendor };
