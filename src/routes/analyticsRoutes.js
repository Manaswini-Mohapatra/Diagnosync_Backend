const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const adminAnalyticsController = require('../controllers/adminAnalyticsController');

router.use(protect);

router.get('/doctor', restrictTo('doctor'), analyticsController.getDoctorAnalytics);
router.get('/admin', restrictTo('admin'), adminAnalyticsController.getAdminDashboard);

module.exports = router;
