const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// ── GET /api/users/me ──────────────────────────────────────────────────────
// Returns full user profile including extended Patient or Doctor data
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;  // set by protect middleware
    let profile = null;

    if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      profile: profile || null
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/users/me ──────────────────────────────────────────────────────
// Update basic user fields (name, phone). Email changes require re-verification.
exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    // Only allow safe fields — never let users update role/password here
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    updates.updatedAt = Date.now();

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: updated
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/users/me ───────────────────────────────────────────────────
// Soft-delete — deactivates the account instead of destroying data
exports.deactivateMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      updatedAt: Date.now()
    });

    res.status(200).json({
      success: true,
      message: 'Account deactivated'
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/users (admin only) ────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/users/stats (admin only) ──────────────────────────────────────
exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const pendingDoctors = await Doctor.countDocuments({
      $or: [
        { verificationStatus: 'pending' },
        { verificationStatus: { $exists: false } }
      ]
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPatients,
        totalDoctors,
        pendingDoctors
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/users/:id/status (admin only) ─────────────────────────────────
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};