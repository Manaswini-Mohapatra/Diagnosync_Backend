const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);
router.use(restrictTo('doctor'));

router.get('/doctor', analyticsController.getDoctorAnalytics);

module.exports = router;
