const mongoose = require('mongoose');


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
  
  condition: {
    type: String,
    required: true
  },
  
  treatmentData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MLTreatment', mlTreatmentSchema);
