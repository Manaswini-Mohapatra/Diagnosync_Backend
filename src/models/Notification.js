const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['appointment', 'prescription', 'reminder', 'alert', 'message'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  relatedEntity: {
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId
  },
  actionUrl: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  sentVia: {
    type: [String],
    enum: ['in-app', 'email', 'sms'],
    default: ['in-app']
  },
  sentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
});

module.exports = mongoose.model('Notification', notificationSchema);