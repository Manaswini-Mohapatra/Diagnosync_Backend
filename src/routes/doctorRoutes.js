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

// ── Public routes (no auth needed) ────────────────────────────────────────
// GET  /api/doctors          — AppointmentBooking Step 1: doctor selection list
router.get('/', getAllDoctors);

// GET  /api/doctors/:id      — Public doctor profile
// ⚠️ Must come AFTER /me route to avoid ':id' swallowing 'me'
router.get('/:id', getDoctorById);

// GET  /api/doctors/:id/slots?date=YYYY-MM-DD — AppointmentBooking Step 2: time slots
router.get('/:id/slots', getDoctorSlots);

// ── Protected routes (require auth) ───────────────────────────────────────
// GET  /api/doctors/me        — DoctorProfilePage: own profile
router.get('/me', protect, restrictTo('doctor'), getMyProfile);

// PUT  /api/doctors/me        — DoctorRegistrationForm: update professional profile
router.put('/me', protect, restrictTo('doctor'), updateMyProfile);

// POST /api/doctors/me/documents       — DoctorRegistrationForm Step 3: add document metadata
router.post('/me/documents', protect, restrictTo('doctor'), addDocument);

// DELETE /api/doctors/me/documents/:docId — remove a document
router.delete('/me/documents/:docId', protect, restrictTo('doctor'), deleteDocument);

module.exports = router;