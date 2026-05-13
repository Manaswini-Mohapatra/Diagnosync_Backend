const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  name: String,
  probability: String,
  severity: String,
  description: String
}, { _id: false });

const predictionSchema = new mongoose.Schema({
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
  primaryCondition: String,
  risk: String,
  urgency: String,
  conditions: [conditionSchema],
  recommendations: [String],
  disclaimer: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Prediction', predictionSchema);
