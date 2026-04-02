const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  refreshToken
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  validate
} = require('../middleware/validation');

// ── Public routes ──────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerValidator, validate, register);

// POST /api/auth/login
router.post('/login', loginValidator, validate, login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

// ── Protected routes ───────────────────────────────────────────────────────

// GET /api/auth/me  — lightweight token check + current user
router.get('/me', protect, getMe);

// POST /api/auth/refresh  — get a fresh token (extend session)
router.post('/refresh', protect, refreshToken);

module.exports = router;