const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  icdCode: String,
  symptoms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Symptom'
    }
  ],
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe']
  },
  description: String,
  contagious: Boolean,
  incubationPeriod: String,
  transmissionMethod: String,
  complications: [String],
  preventionMeasures: [String],
  commonTreatments: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Condition', conditionSchema);