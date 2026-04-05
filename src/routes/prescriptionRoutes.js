const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET: All prescriptions (role-filtered in controller)
router.get('/', prescriptionController.getPrescriptions);

// POST: Create a new prescription (Doctors only)
router.post('/', restrictTo('doctor', 'admin'), prescriptionController.createPrescription);

// PATCH: Update status (e.g. active -> completed/discontinued) (Doctors only)
router.patch('/:id/status', restrictTo('doctor', 'admin'), prescriptionController.updateStatus);

// POST: Request a refill (Patients only)
router.post('/:id/refill', restrictTo('patient'), prescriptionController.requestRefill);

module.exports = router;