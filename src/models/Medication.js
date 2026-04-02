const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  genericName: String,
  strength: String,
  form: {
    type: String,
    enum: ['tablet', 'liquid', 'injection', 'capsule', 'powder', 'cream', 'spray']
  },
  manufacturer: String,
  dosage: String,
  frequency: String,
  sideEffects: [String],
  interactions: [String],
  contraindications: [String],
  warnings: [String],
  approvedUses: [String],
  storageInstructions: String,
  price: Number,
  availability: Boolean,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medication', medicationSchema);