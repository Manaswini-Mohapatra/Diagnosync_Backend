const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },


  age: { type: Number, min: 0, max: 120 },  
  height: Number,           
  weight: Number,           
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', '']
  },
  dateOfBirth: Date,       


  medicalConditions: [String],
  allergies: [String],
  surgeries: [String],
  familyHistory: String,
  medications: [String],  


  smokingStatus: {
    type: String,
    enum: ['never', 'former', 'current', 'occasional', ''],
    default: 'never'
  },
  alcoholConsumption: {     
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


  emergencyContact: String,
  emergencyPhone: String,

  reports: [{
    title: String,
    fileUrl: String,
    fileType: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

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
  timestamps: true   
});


patientSchema.index({ userId: 1 });

module.exports = mongoose.model('Patient', patientSchema);