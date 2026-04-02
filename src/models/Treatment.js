const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  conditionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condition'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe']
  },
  symptoms: [String],
  medications: [
    {
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      sideEffects: [String],
      interactions: [String]
    }
  ],
  lifestyle: [String],
  warnings: [String],
  emergencyWarnings: String,
  doctorConsultationRecommended: Boolean,
  followUpSchedule: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Treatment', treatmentSchema);