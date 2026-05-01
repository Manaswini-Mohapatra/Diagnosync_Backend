const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // ── Participants ───────────────────────────────────────────────────────────
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

  // ── Schedule ───────────────────────────────────────────────────────────────
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,     // e.g. '09:00 AM', '14:30'
    required: true
  },
  duration: {
    type: Number,     // minutes — frontend uses 15/30/45/60/90/120
    default: 30
  },

  // ── Type ───────────────────────────────────────────────────────────────────
  // Frontend (AppointmentBooking.jsx) sends: 'video' or 'inperson'
  // Frontend (DoctorAppointmentsPage.jsx) sends: 'Video', 'In-Person', 'Phone'
  // Storing lowercase canonical values; controllers will normalise on input
  type: {
    type: String,
    enum: ['video', 'in-person', 'phone'],
    default: 'video',
    lowercase: true,  // auto-lowercase whatever comes in
    set: (v) => {
      // Normalise frontend variants → canonical values
      if (!v) return 'video';
      const map = {
        'video': 'video',
        'inperson': 'in-person',
        'in-person': 'in-person',
        'in person': 'in-person',
        'phone': 'phone'
      };
      return map[v.toLowerCase()] || 'video';
    }
  },

  // ── Details ────────────────────────────────────────────────────────────────
  reason: String,
  notes: String,

  // ── Status ─────────────────────────────────────────────────────────────────
  // Matches both DoctorAppointmentsPage.jsx and AppointmentBooking.jsx
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },

  // ── Reminder ───────────────────────────────────────────────────────────────
  reminderSent: {
    type: Boolean,
    default: false
  },

  // ── Patient Rating (after appointment is completed) ────────────────────
  rating: {
    score:   { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    ratedAt: { type: Date }
  }

}, {
  timestamps: true  // auto-manages createdAt + updatedAt
});

// Indexes for common query patterns
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);