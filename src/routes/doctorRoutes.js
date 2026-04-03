const express = require('express');
const router  = express.Router();

const {
  getAllDoctors,
  getDoctorById,
  getDoctorSlots,
  getMyProfile,
  updateMyProfile,
  addDocument,
  deleteDocument
} = require('../controllers/doctorController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

// ── IMPORTANT: Specific string routes MUST come BEFORE param routes ────────
// Otherwise Express matches '/me' as '/:id' with id="me"

// ── Public routes (no auth) ────────────────────────────────────────────────

// GET /api/doctors — AppointmentBooking Step 1: doctor list
router.get('/', getAllDoctors);

// ── Protected /me routes (must come BEFORE /:id) ──────────────────────────

// GET  /api/doctors/me — DoctorProfilePage: own profile
router.get('/me', protect, restrictTo('doctor'), getMyProfile);

// PUT  /api/doctors/me — DoctorRegistrationForm: update professional profile
router.put('/me', protect, restrictTo('doctor'), updateMyProfile);

// POST /api/doctors/me/documents — DoctorRegistrationForm Step 3: add doc metadata
router.post('/me/documents', protect, restrictTo('doctor'), addDocument);

// DELETE /api/doctors/me/documents/:docId — remove a document
router.delete('/me/documents/:docId', protect, restrictTo('doctor'), deleteDocument);

// ── Dynamic param routes (must come AFTER /me) ─────────────────────────────

// GET /api/doctors/:id — Public doctor profile (accepts Doctor _id OR User _id)
router.get('/:id', getDoctorById);

// GET /api/doctors/:id/slots?date=YYYY-MM-DD — AppointmentBooking Step 2
router.get('/:id/slots', getDoctorSlots);

module.exports = router;