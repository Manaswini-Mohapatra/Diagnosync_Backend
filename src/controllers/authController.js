const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { generateAccessToken, generateOtpToken, verifyToken } = require('../utils/tokenUtils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip password from a user object before sending to client */
const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

/** Build the token payload */
const buildPayload = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role
});

// ── POST /api/auth/register ────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    // Create User (password hashing done by pre-save hook in User model)
    const user = await User.create({ name, email, password, phone, role });

    // Create extended profile automatically
    if (role === 'patient') {
      await Patient.create({ userId: user._id });
    } else if (role === 'doctor') {
      // licenseNumber is required — use a placeholder until registration form is filled
      await Doctor.create({ userId: user._id, licenseNumber: `PENDING-${user._id}` });
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch(() => {});

    // Generate token
    const token = generateAccessToken(buildPayload(user));

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Intentionally vague message to prevent email enumeration
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateAccessToken(buildPayload(user));

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
// Returns current authenticated user (protect middleware already attached req.user)
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user)
  });
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always respond 200 — don't leak whether email exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent'
      });
    }

    // Generate a short-lived reset token (1 hour)
    const resetToken = generateOtpToken({ id: user._id.toString(), purpose: 'reset' }, '1h');

    // In production this URL would point to your frontend reset page
    const resetUrl = `${process.env.CORS_ORIGIN}/password-reset?token=${resetToken}`;

    await sendPasswordResetEmail(email, resetUrl);

    res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Reset token is required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ success: false, error: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.password = password;  // pre-save hook will hash it
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/refresh ─────────────────────────────────────────────────
// Simple re-issue — in production you'd use a separate refresh token stored server-side
exports.refreshToken = async (req, res, next) => {
  try {
    // protect middleware has already run, req.user is populated
    const token = generateAccessToken(buildPayload(req.user));
    res.status(200).json({ success: true, token });
  } catch (error) {
    next(error);
  }
};