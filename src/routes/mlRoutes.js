const express = require('express');
const mlController = require('../controllers/mlController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/diagnose', authMiddleware, mlController.diagnosisPredict);

module.exports = router;