const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  userAgent: String,
  ip: String,
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 
  }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
