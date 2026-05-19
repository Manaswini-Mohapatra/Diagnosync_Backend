const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

router.patch('/all/read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

if (process.env.NODE_ENV !== 'production') {
  router.post('/test', async (req, res, next) => {
    try {
      const { type = 'appointment', title = 'Test Notification', message = 'This is a test notification from the API.', priority = 'medium' } = req.body;
      const notification = await Notification.create({
        userId:   req.user._id,
        type,
        title,
        message,
        priority,
        sentAt:   new Date()
      });
      res.status(201).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  });
}

module.exports = router;