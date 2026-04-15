const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware to all appointment routes
router.use(protect);

router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', appointmentController.updateAppointment);
router.patch('/:id/status', appointmentController.updateStatus);
router.patch('/:id/rate', appointmentController.rateAppointment);
router.patch('/:id/reschedule', appointmentController.rescheduleAppointment);
router.patch('/:id/reminder', appointmentController.sendReminder);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;