const { verifyToken } = require('../utils/token');

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

module.exports = { authenticate, authorize };
