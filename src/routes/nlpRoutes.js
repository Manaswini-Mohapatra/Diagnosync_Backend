const express = require('express');
const nlpController = require('../controllers/nlpController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze', authMiddleware, nlpController.analyzeSymptoms);

module.exports = router;