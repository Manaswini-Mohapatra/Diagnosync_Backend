const express = require('express');
const mlController = require('../controllers/mlController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All ML routes are protected
router.use(protect);

router.post('/session', mlController.startSession);
router.post('/chat', mlController.chatWithBot);
router.post('/treatment', mlController.getTreatment);

module.exports = router;