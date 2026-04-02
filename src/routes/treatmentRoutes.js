const express = require('express');
const treatmentController = require('../controllers/treatmentController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, treatmentController.createTreatment);
router.get('/patient/:patientId', authMiddleware, treatmentController.getPatientTreatments);
router.get('/:id', authMiddleware, treatmentController.getTreatment);
router.patch('/:id', authMiddleware, treatmentController.updateTreatment);
router.delete('/:id', authMiddleware, treatmentController.deleteTreatment);
router.get('/condition/:conditionId', authMiddleware, treatmentController.getTreatmentsByCondition);

module.exports = router;