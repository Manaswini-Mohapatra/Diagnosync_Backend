const express = require('express');
const healthMetricsController = require('../controllers/healthMetricsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Require auth for all routes
router.use(protect);

// Allowed for doctors and patients (patients logging their own, doctors logging for patients)
router.post('/', restrictTo('patient', 'doctor', 'admin'), healthMetricsController.createHealthMetric);

// Accessible by patient or their doctor
router.get('/patient/:patientId', healthMetricsController.getPatientMetrics);
router.get('/patient/:patientId/latest', healthMetricsController.getLatestMetric);
router.get('/patient/:patientId/summary', healthMetricsController.getMetricsSummary);

// Modifying existing records
router.patch('/:id', restrictTo('patient', 'doctor', 'admin'), healthMetricsController.updateHealthMetric);
router.delete('/:id', restrictTo('admin', 'doctor', 'patient'), healthMetricsController.deleteHealthMetric);

module.exports = router;
