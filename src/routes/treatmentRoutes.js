const express = require('express');
const treatmentController = require('../controllers/treatmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/patient/:patientId', treatmentController.getPatientTreatments);
router.get('/:id', treatmentController.getTreatment);
router.get('/condition/:conditionId', treatmentController.getTreatmentsByCondition);

// Doctor or Admin required for write modifications
router.patch('/:id/verify', restrictTo('doctor', 'admin'), treatmentController.verifyTreatment);
router.post('/', restrictTo('doctor', 'admin', 'patient'), treatmentController.createTreatment);
router.patch('/:id', restrictTo('doctor', 'admin'), treatmentController.updateTreatment);
router.delete('/:id', restrictTo('doctor', 'admin'), treatmentController.deleteTreatment);

module.exports = router;