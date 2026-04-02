const mongoose = require('mongoose');

// Sub-schema for uploaded verification documents
// DoctorRegistrationForm Step 3 — stores metadata only (not the actual file)
// Actual files should go to Cloudinary / file storage, not MongoDB (Atlas 512MB limit)
const documentSchema = new mongoose.Schema({
  fileName:    { type: String, required: true },
  fileType:    { type: String },           // MIME type e.g. 'application/pdf'
  fileSize:    { type: Number },           // bytes
  documentType: {
    type: String,
    enum: ['certificate', 'license', 'degree', 'specialization', 'other'],
    default: 'certificate'
  },
  description: { type: String },
  fileUrl:     { type: String },           // URL if stored on Cloudinary etc.
  uploadDate:  { type: Date, default: Date.now }
}, { _id: true });

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // ── License & affiliation ──────────────────────────────────────────────────
  // DoctorRegistrationForm Step 1
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  licenseState: String,
  hospitalAffiliation: String,
  yearsOfExperience: Number,

  // ── Specialties & qualifications ───────────────────────────────────────────
  // DoctorRegistrationForm Step 2
  specialties: [String],      // array — frontend sends as array of selected items
  qualifications: [String],
  languages: [String],
  consultationFee: Number,    // stored as number; controller formats to '$100' for response
  bio: String,

  // ── Ratings ────────────────────────────────────────────────────────────────
  // AppointmentBooking.jsx displays: rating (number) + reviewCount
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

  // ── Availability ───────────────────────────────────────────────────────────
  // availableSlots used by AppointmentBooking Step 2 (time slot selection)
  // Structure: { "monday": ["9:00 AM", "9:30 AM", ...], "tuesday": [...] }
  availableSlots: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // ── Verification documents ─────────────────────────────────────────────────
  // DoctorRegistrationForm Step 3 — metadata only, no file data in DB
  documents: [documentSchema],

  // ── Verification status ────────────────────────────────────────────────────
  // Added: admin can mark doctors as verified after reviewing documents
  isVerified: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true   // auto-manages createdAt + updatedAt
});

// Indexes
doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialties: 1 });
doctorSchema.index({ isVerified: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);