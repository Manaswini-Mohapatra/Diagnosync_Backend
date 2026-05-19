const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const crypto = require('crypto');
const { generateAccessToken, generateOtpToken, verifyToken } = require('../utils/tokenUtils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { isStrongPassword, STRONG_PASSWORD_MESSAGE } = require('../utils/passwordUtils');

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip password from a user object before sending to client */
const sanitizeUser = async (user) => {
  const obj = user.toObject();
  delete obj.password;
  if (obj.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: obj._id });
    if (doctor) {
      obj.verificationStatus = doctor.verificationStatus;
    }
  }
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

    // Enforce strong password for new registrations
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, error: STRONG_PASSWORD_MESSAGE });
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
      user: await sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Intentionally vague message to prevent email enumeration
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Role verification: Admins can log in from any portal.
    // For others, the requested role must match the DB role.
    if (role && user.role !== 'admin' && user.role !== role) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid role selection for this account' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateAccessToken(buildPayload(user));

    // Soft enforcement: flag weak passwords so frontend can show an upgrade banner
    // Does NOT block login — existing users with old weak passwords still get in.
    const weakPassword = !isStrongPassword(req.body.password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: await sanitizeUser(user),
      weakPassword
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
    user: await sanitizeUser(req.user)
  });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent'
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    let clientOrigin = req.get('origin');
    if (!clientOrigin) {
      const referer = req.get('referer');
      if (referer) {
        try {
          const parsed = new URL(referer);
          clientOrigin = `${parsed.protocol}//${parsed.host}`;
        } catch (e) {
          // fallback
        }
      }
    }
    if (!clientOrigin) {
      clientOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    }
    const cleanOrigin = clientOrigin.replace(/\/$/, '');
    const resetUrl = `${cleanOrigin}/password-reset?token=${rawToken}`;

    console.log(`Password reset requested for ${email}: ${resetUrl}`);

    sendPasswordResetEmail(email, resetUrl, rawToken).catch((err) =>
      console.error('Failed to send reset email:', err.message)
    );

    const responsePayload = {
      success: true,
      message: 'If that email exists, a reset link has been sent'
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.token = rawToken;
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-reset-token
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Reset token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    res.status(200).json({ success: true, valid: true });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, newPassword } = req.body;
    const actualPassword = newPassword || password;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Reset token is required' });
    }

    if (!actualPassword) {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    // Enforce strong password for resets
    if (!isStrongPassword(actualPassword)) {
      return res.status(400).json({ success: false, error: STRONG_PASSWORD_MESSAGE });
    }

    user.password = actualPassword;  // pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
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