const express = require('express');
const router  = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById,
  uploadReport,
  deleteReport
} = require('../controllers/patientController');

const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All patient routes require authentication
router.use(protect);

// ── Own profile ────────────────────────────────────────────────────────────
// GET  /api/patients/me  — PatientProfilePage
router.get('/me', restrictTo('patient'), getMyProfile);

// PUT  /api/patients/me  — PatientRegistrationForm (save health profile)
router.put('/me', restrictTo('patient'), updateMyProfile);

// POST /api/patients/me/reports — Patient uploads a medical report
router.post('/me/reports', restrictTo('patient'), upload.single('report'), uploadReport);

// DELETE /api/patients/me/reports/:reportId — Patient deletes a medical report
router.delete('/me/reports/:reportId', restrictTo('patient'), deleteReport);

// ── Doctor access to patients ──────────────────────────────────────────────
// GET  /api/patients       — PatientList.jsx (doctor views patient list)
router.get('/', restrictTo('doctor', 'admin'), getAllPatients);

// GET  /api/patients/:id   — Doctor views a specific patient
router.get('/:id', restrictTo('doctor', 'admin'), getPatientById);

module.exports = router;