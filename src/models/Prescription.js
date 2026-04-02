const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  // ── Who ────────────────────────────────────────────────────────────────────
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ── Medication details ─────────────────────────────────────────────────────
  // All fields used in PrescriptionPage.jsx
  medicationName: {
    type: String,
    required: true,
    trim: true
  },
  strength: String,           // e.g. '500mg', '10mg'
  form: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Other'],
    default: 'Tablet'
  },
  frequency: String,          // e.g. 'Once daily', 'Twice daily'
  quantity: String,           // e.g. '30 tablets', '60 capsules'
  indication: String,         // reason for prescribing
  instructions: String,       // patient-facing directions
  notes: String,              // ← Added: doctor notes on the prescription

  // ── Refill tracking ────────────────────────────────────────────────────────
  refillsRemaining: {         // ← Added: tracks how many refills are left
    type: Number,
    default: 0,
    min: 0
  },

  // ── Dates ──────────────────────────────────────────────────────────────────
  prescribedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,

  // ── Pharmacy & reference ───────────────────────────────────────────────────
  pharmacy: String,           // ← Added: pharmacy name e.g. 'Central Pharmacy'
  prescriptionNumber: {       // ← Added: unique ref e.g. 'RX-2024-001'
    type: String,
    trim: true
  },

  // ── Status ─────────────────────────────────────────────────────────────────
  // Frontend uses: 'active', 'discontinued'
  // Added 'completed' and 'expired' for full lifecycle coverage
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued', 'expired'],
    default: 'active'
  }

}, {
  timestamps: true   // auto-manages createdAt + updatedAt
});

// Indexes for common query patterns
prescriptionSchema.index({ patientId: 1, status: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);