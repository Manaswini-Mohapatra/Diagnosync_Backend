const express = require('express');
const router  = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById
} = require('../controllers/patientController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

// All patient routes require authentication
router.use(protect);

// ── Own profile ────────────────────────────────────────────────────────────
// GET  /api/patients/me  — PatientProfilePage
router.get('/me', restrictTo('patient'), getMyProfile);

// PUT  /api/patients/me  — PatientRegistrationForm (save health profile)
router.put('/me', restrictTo('patient'), updateMyProfile);

// ── Doctor access to patients ──────────────────────────────────────────────
// GET  /api/patients       — PatientList.jsx (doctor views patient list)
router.get('/', restrictTo('doctor', 'admin'), getAllPatients);

// GET  /api/patients/:id   — Doctor views a specific patient
router.get('/:id', restrictTo('doctor', 'admin'), getPatientById);

module.exports = router;