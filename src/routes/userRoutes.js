const express = require('express');
const router = express.Router();

const {
  getMe,
  updateMe,
  deactivateMe,
  getAllUsers,
  getUserStats,
  updateUserStatus
} = require('../controllers/userController');

const { protect, restrictTo } = require('../middleware/authMiddleware');
const { updateUserValidator, validate } = require('../middleware/validation');

// All user routes require authentication
router.use(protect);

// GET  /api/users/me  — full profile (User + Patient/Doctor doc)
router.get('/me', getMe);

// PUT  /api/users/me  — update name / phone
router.put('/me', updateUserValidator, validate, updateMe);

// DELETE /api/users/me — soft-deactivate own account
router.delete('/me', deactivateMe);

// GET /api/users — admin only: list all users
router.get('/', restrictTo('admin'), getAllUsers);

// GET /api/users/stats — admin only: get user counts
router.get('/stats', restrictTo('admin'), getUserStats);

// PATCH /api/users/:id/status — admin only: activate/deactivate user
router.patch('/:id/status', restrictTo('admin'), updateUserStatus);

module.exports = router;