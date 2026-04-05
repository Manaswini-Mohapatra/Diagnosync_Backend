const express = require('express');
const drugInteractionController = require('../controllers/drugInteractionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Only doctors (and admins) should be able to check interactions
router.post('/check', restrictTo('doctor', 'admin'), drugInteractionController.checkInteractions);

module.exports = router;