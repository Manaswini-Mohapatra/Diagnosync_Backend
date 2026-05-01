const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// All payment routes require patient authentication
router.use(protect);
router.use(restrictTo('patient'));

// POST /api/payments/create
router.post('/create', paymentController.createPayment);

module.exports = router;
