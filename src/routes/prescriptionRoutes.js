const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, prescriptionController.createPrescription);
router.get('/', authMiddleware, prescriptionController.getPrescriptions);
router.post('/:id/refill', authMiddleware, prescriptionController.requestRefill);

module.exports = router;