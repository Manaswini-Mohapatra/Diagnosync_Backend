const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'respiratory', 'cardiovascular', 'neurological', 'gastrointestinal',
      'musculoskeletal', 'dermatological', 'urological', 'endocrine',
      'mental_health', 'reproductive', 'sensory', 'general', 'other'
    ],
    default: 'general'
  },
  bodyLocation: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'critical'],
    default: 'mild'
  },
  // Common conditions this symptom is associated with (references only — not embedded to save Atlas storage)
  relatedConditions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condition'
  }],
  isCommon: {
    type: Boolean,
    default: false
  },
  requiresUrgentCare: {
    type: Boolean,
    default: false
  },
  // Keywords for basic symptom matching (used until NLP is implemented)
  keywords: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Index for fast symptom name search
symptomSchema.index({ name: 1 });
symptomSchema.index({ category: 1 });
symptomSchema.index({ isCommon: 1 });

module.exports = mongoose.model('Symptom', symptomSchema);
