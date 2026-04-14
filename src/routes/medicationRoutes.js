const express = require('express');
const medicationController = require('../controllers/medicationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', medicationController.getMedications);

module.exports = router;
