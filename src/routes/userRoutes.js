const express = require('express');
const router = express.Router();

const {
  getMe,
  updateMe,
  deactivateMe,
  getAllUsers
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

module.exports = router;