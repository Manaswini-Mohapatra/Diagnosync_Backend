const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
 
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

 
  medicationName: {
    type: String,
    required: true,
    trim: true
  },
  strength: String,           
  form: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Other'],
    default: 'Tablet'
  },
  frequency: String,          
  quantity: String,           
  indication: String,         
  instructions: String,       
  notes: String,             

  refillsRemaining: {         
    type: Number,
    default: 0,
    min: 0
  },


  prescribedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,


  pharmacy: String,           
  prescriptionNumber: {       
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued', 'expired'],
    default: 'active'
  }

}, {
  timestamps: true   
});


prescriptionSchema.index({ patientId: 1, status: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);