const Prescription = require('../models/Prescription');
const User = require('../models/User');
const { createSystemNotification } = require('./notificationController');

// ── Helper: format prescription ───────────────────────────────────────────
const formatPrescription = (pres, patientUser, doctorUser) => ({
  id: pres._id,
  patientId: pres.patientId,
  patientName: patientUser?.name || 'Unknown',
  patientEmail: patientUser?.email || '',
  doctorId: pres.doctorId,
  doctorName: doctorUser?.name || 'Unknown',
  medicationName: pres.medicationName,
  strength: pres.strength,
  form: pres.form,
  frequency: pres.frequency,
  quantity: pres.quantity,
  indication: pres.indication,
  instructions: pres.instructions,
  notes: pres.notes,
  refillsRemaining: pres.refillsRemaining,
  prescribedDate: pres.prescribedDate,
  expiryDate: pres.expiryDate,
  pharmacy: pres.pharmacy,
  prescriptionNumber: pres.prescriptionNumber,
  status: pres.status,
  createdAt: pres.createdAt,
  updatedAt: pres.updatedAt
});

// ── POST /api/prescriptions ────────────────────────────────────────────────
// Doctor only. Creates new prescription
exports.createPrescription = async (req, res, next) => {
  try {
    const {
      patientId, medicationName, strength, form, frequency,
      quantity, indication, instructions, notes, refillsRemaining,
      expiryDate, pharmacy
    } = req.body;

    if (!patientId || !medicationName) {
      return res.status(400).json({ success: false, error: 'Patient ID and Medication Name are required' });
    }

    // Doctor ID comes from the authenticated user
    const doctorId = req.user._id;

    // Verify patient exists
    const patientUser = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patientUser) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      medicationName,
      strength,
      form,
      frequency,
      quantity,
      indication,
      instructions,
      notes,
      refillsRemaining: refillsRemaining || 0,
      prescribedDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      pharmacy,
      prescriptionNumber: `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    const formatted = formatPrescription(prescription, patientUser, req.user);

    // Notify patient
    await createSystemNotification({
      userId: patientId,
      type: 'prescription',
      title: 'New Prescription',
      message: `Dr. ${req.user.name} has prescribed ${medicationName} for you.`,
      actionUrl: '/patient/prescriptions'
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/prescriptions ─────────────────────────────────────────────────
// Role-aware list query for dashboards
exports.getPrescriptions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctorId = req.user._id;
    }

    if (status) filter.status = status;

    const prescriptions = await Prescription.find(filter)
      .sort({ prescribedDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email');

    const total = await Prescription.countDocuments(filter);

    // Format response array using helper
    const populated = prescriptions.map(p => 
      formatPrescription(p, p.patientId, p.doctorId)
    );

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      prescriptions: populated
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/prescriptions/:id/status ───────────────────────────────────
// Doctor updates status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const pres = await Prescription.findById(req.params.id);

    if (!pres) return res.status(404).json({ success: false, error: 'Prescription not found' });

    // Ensure doctor owns this prescription or is admin
    if (pres.doctorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    pres.status = status;
    await pres.save();

    res.status(200).json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/prescriptions/:id/refill ─────────────────────────────────────
// Patient requests a refill
exports.requestRefill = async (req, res, next) => {
  try {
    const pres = await Prescription.findById(req.params.id);
    if (!pres) return res.status(404).json({ success: false, error: 'Prescription not found' });

    // Validate ownership
    if (pres.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (pres.refillsRemaining <= 0) {
      return res.status(400).json({ success: false, error: 'No refills remaining' });
    }

    pres.refillsRemaining -= 1;
    await pres.save();

    // Alert the doctor urgently
    await createSystemNotification({
      userId: pres.doctorId,
      type: 'prescription',
      priority: 'high',
      title: 'Refill Requested',
      message: `A patient has requested a refill for ${pres.medicationName}. You have been alerted to review.`,
      actionUrl: `/doctor/prescriptions/${pres._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Refill requested successfully',
      data: { refillsRemaining: pres.refillsRemaining }
    });
  } catch (error) {
    next(error);
  }
};