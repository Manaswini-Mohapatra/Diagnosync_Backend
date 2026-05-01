const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // ── Physical info ──────────────────────────────────────────────────────────
  // PatientRegistrationForm Step 1
  age: { type: Number, min: 0, max: 120 },  // stored directly
  height: Number,           // cm
  weight: Number,           // kg
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', '']
  },
  dateOfBirth: Date,        // collected in SignUp as 'dob'

  // ── Medical history ────────────────────────────────────────────────────────
  // PatientRegistrationForm Step 2
  // Frontend field name: 'conditions'  →  stored as: 'medicalConditions'
  medicalConditions: [String],
  allergies: [String],
  surgeries: [String],
  familyHistory: String,
  medications: [String],    // ← Added: current medications the patient is on

  // ── Lifestyle ──────────────────────────────────────────────────────────────
  // PatientRegistrationForm Step 3
  smokingStatus: {
    type: String,
    enum: ['never', 'former', 'current', 'occasional', ''],
    default: 'never'
  },
  alcoholConsumption: {     // ← Added: was in frontend but missing from model
    type: String,
    enum: ['never', 'occasional', 'moderate', 'heavy', ''],
    default: 'never'
  },
  exerciseFrequency: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'vigorous', ''],
    default: 'moderate'
  },
  diet: {
    type: String,
    enum: ['balanced', 'vegetarian', 'vegan', 'keto', 'other', ''],
    default: 'balanced'
  },

  // ── Emergency contact ──────────────────────────────────────────────────────
  emergencyContact: String,
  emergencyPhone: String,

  // ── Medical Reports ────────────────────────────────────────────────────────
  reports: [{
    title: String,
    fileUrl: String,
    fileType: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // ── Calculated Health Score ────────────────────────────────────────────────
  healthScore: {
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['Good', 'Moderate', 'Critical', 'None'], default: 'None' },
    bmi: { type: Number, default: 0 },
    breakdown: {
      bmiPenalty: { type: Number, default: 0 },
      diseasePenalty: { type: Number, default: 0 },
      allergyPenalty: { type: Number, default: 0 },
      familyHistoryPenalty: { type: Number, default: 0 },
      smokingPenalty: { type: Number, default: 0 },
      exercisePenalty: { type: Number, default: 0 },
      agePenalty: { type: Number, default: 0 }
    }
  }

}, {
  timestamps: true   // auto-manages createdAt + updatedAt
});

// Index for fast lookup by userId
patientSchema.index({ userId: 1 });

module.exports = mongoose.model('Patient', patientSchema);