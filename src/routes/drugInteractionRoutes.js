const express = require('express');
const drugInteractionController = require('../controllers/drugInteractionController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/check', authMiddleware, drugInteractionController.checkInteractions);

module.exports = router;