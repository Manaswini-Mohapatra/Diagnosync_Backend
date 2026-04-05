const Notification = require('../models/Notification');

// ── INTERNAL HELPER ────────────────────────────────────────────────────────
// Used by other controllers to seamlessly dispatch notifications
exports.createSystemNotification = async ({ userId, type, title, message, priority = 'medium', actionUrl }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      actionUrl,
      priority,
      sentAt: new Date()
    });
    return notification;
  } catch (error) {
    console.error('Failed to create system notification:', error);
  }
};

// ── GET /api/notifications ─────────────────────────────────────────────────
// Get user notifications (using req.user securely)
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { read } = req.query;
    let filter = { userId: req.user._id };
    
    if (read !== undefined) filter.read = read === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/notifications/unread-count ────────────────────────────────────
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notifications/:id/read ──────────────────────────────────────
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id }, // Ensure ownership
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notifications/read-all ──────────────────────────────────────
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/notifications/:id ──────────────────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};