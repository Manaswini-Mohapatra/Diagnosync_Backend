const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({

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


  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,    
    default: 30
  },

  type: {
    type: String,
    enum: ['video', 'in-person', 'phone'],
    default: 'video',
    lowercase: true, 
    set: (v) => {

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

  reason: String,
  notes: String,

  status: {
    type: String,
    enum: ['pending', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },


  reminderSent: {
    type: Boolean,
    default: false
  },


  rating: {
    score:   { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    ratedAt: { type: Date }
  }

}, {
  timestamps: true  
});


appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);