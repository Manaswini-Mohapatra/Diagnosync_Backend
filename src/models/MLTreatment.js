const mongoose = require('mongoose');

// Stores full treatment API response for a patient's ML session
const mlTreatmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true
  },
  // The primary condition identified
  condition: {
    type: String,
    required: true
  },
  // Raw full response from the Treatment API (primary + runner_ups)
  treatmentData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MLTreatment', mlTreatmentSchema);
