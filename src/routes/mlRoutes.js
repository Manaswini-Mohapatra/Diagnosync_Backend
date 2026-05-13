const express = require('express');
const mlController = require('../controllers/mlController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All ML routes are protected
router.use(protect);

// Session + Chat
router.post('/session',   mlController.startSession);
router.post('/chat',      mlController.chatWithBot);

// Legacy treatment endpoint (kept for backward compatibility)
router.post('/treatment', mlController.getTreatment);

// History endpoints
router.get('/history/chat',      mlController.getChatHistory);
router.get('/history/treatment', mlController.getTreatmentHistory);

module.exports = router;