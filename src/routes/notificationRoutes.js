const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

router.patch('/all/read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;