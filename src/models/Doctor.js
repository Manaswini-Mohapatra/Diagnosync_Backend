const mongoose = require('mongoose');


const documentSchema = new mongoose.Schema({
  fileName:    { type: String, required: true },
  fileType:    { type: String },           
  fileSize:    { type: Number },           
  documentType: {
    type: String,
    enum: ['certificate', 'license', 'degree', 'specialization', 'other'],
    default: 'certificate'
  },
  description: { type: String },
  fileUrl:     { type: String },         
  publicId:    { type: String },         
  uploadDate:  { type: Date, default: Date.now }
}, { _id: true });

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },


  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  licenseState: String,
  hospitalAffiliation: String,
  yearsOfExperience: Number,


  specialties: [String],      
  qualifications: [String],
  languages: [String],
  consultationFee: Number,    
  bio: String,


  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },


  availableSlots: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  
  documents: [documentSchema],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }

}, {
  timestamps: true 
});


doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialties: 1 });
doctorSchema.index({ isVerified: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);