const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');

// ── protect ────────────────────────────────────────────────────────────────
// Verifies JWT and attaches the full user document to req.user.
// Usage: router.get('/route', protect, handler)
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);   // throws if expired / invalid

    // Attach full user document (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account is deactivated' });
    }

    req.user = user;   // used by controllers as req.user._id, req.user.role, etc.
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ── restrictTo ─────────────────────────────────────────────────────────────
// Role-based access control — must come AFTER protect.
// Usage: router.get('/route', protect, restrictTo('admin', 'doctor'), handler)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};