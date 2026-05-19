const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const upload  = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const {
  getAllDoctors,
  getDoctorById,
  getDoctorSlots,
  getMyProfile,
  updateMyProfile,
  addDocument,
  deleteDocument,
  verifyDoctor
} = require('../controllers/doctorController');

const { protect, restrictTo } = require('../middleware/authMiddleware');


router.get('/', getAllDoctors);
router.get('/me', protect, restrictTo('doctor'), getMyProfile);


router.put('/me', protect, restrictTo('doctor'), updateMyProfile);
router.post('/me/documents', protect, restrictTo('doctor'), upload.single('file'), addDocument);

router.delete('/me/documents/:docId', protect, restrictTo('doctor'), deleteDocument);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);

router.patch('/:id/verify', protect, restrictTo('admin'), verifyDoctor);

module.exports = router;