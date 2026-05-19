const express = require('express');
const mlController = require('../controllers/mlController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);


router.post('/session',   mlController.startSession);
router.post('/chat',      mlController.chatWithBot);


router.post('/treatment', mlController.getTreatment);


router.get('/history/chat',      mlController.getChatHistory);
router.get('/history/treatment', mlController.getTreatmentHistory);

module.exports = router;