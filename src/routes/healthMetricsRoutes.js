const express = require('express');
const healthMetricsController = require('../controllers/healthMetricsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);


router.post('/', restrictTo('patient', 'doctor', 'admin'), healthMetricsController.createHealthMetric);


router.get('/patient/:patientId', healthMetricsController.getPatientMetrics);
router.get('/patient/:patientId/latest', healthMetricsController.getLatestMetric);
router.get('/patient/:patientId/summary', healthMetricsController.getMetricsSummary);
router.patch('/:id', restrictTo('patient', 'doctor', 'admin'), healthMetricsController.updateHealthMetric);
router.delete('/:id', restrictTo('admin', 'doctor', 'patient'), healthMetricsController.deleteHealthMetric);

module.exports = router;
