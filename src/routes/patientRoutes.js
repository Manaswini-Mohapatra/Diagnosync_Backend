const express = require('express');
const router  = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById,
  uploadReport,
  deleteReport
} = require('../controllers/patientController');

const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.use(protect);


router.get('/me', restrictTo('patient'), getMyProfile);


router.put('/me', restrictTo('patient'), updateMyProfile);


router.post('/me/reports', restrictTo('patient'), upload.single('report'), uploadReport);


router.delete('/me/reports/:reportId', restrictTo('patient'), deleteReport);


router.get('/', restrictTo('doctor', 'admin'), getAllPatients);


router.get('/:id', restrictTo('doctor', 'admin'), getPatientById);

module.exports = router;