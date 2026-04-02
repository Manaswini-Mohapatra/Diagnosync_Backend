const mongoose = require('mongoose');

const drugInteractionSchema = new mongoose.Schema({
  drug1: {
    type: String,
    required: true
  },
  drug2: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['major', 'moderate', 'minor', 'none'],
    default: 'none'
  },
  probability: {
    type: Number,
    min: 0,
    max: 1
  },
  description: String,
  mechanism: String,
  symptoms: [String],
  recommendation: String,
  alternativeForDrug1: String,
  alternativeForDrug2: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DrugInteraction', drugInteractionSchema);