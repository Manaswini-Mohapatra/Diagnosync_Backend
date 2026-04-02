const mongoose = require('mongoose');

const healthMetricsSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  temperature: Number,
  weight: Number,
  height: Number,
  bmi: Number,
  bloodSugar: Number,
  cholesterol: Number,
  oxygenSaturation: Number,
  respiratoryRate: Number,
  notes: String,
  recordedBy: {
    type: String,
    enum: ['patient', 'doctor', 'device']
  },
  deviceType: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HealthMetrics', healthMetricsSchema);