const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, notificationController.createNotification);
router.get('/:userId', authMiddleware, notificationController.getUserNotifications);
router.post('/:id/read', authMiddleware, notificationController.markAsRead);
router.post('/:userId/read-all', authMiddleware, notificationController.markAllAsRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);
router.delete('/:userId/all', authMiddleware, notificationController.deleteAllNotifications);
router.get('/:userId/unread-count', authMiddleware, notificationController.getUnreadCount);

module.exports = router;