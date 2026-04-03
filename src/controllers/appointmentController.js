const Appointment = require('../models/Appointment');
const User        = require('../models/User');
const Doctor      = require('../models/Doctor');

// ── Helper: format appointment for response ────────────────────────────────
// Populates patient and doctor info inline so frontend gets everything in one call
const formatAppointment = (apt, patientUser, doctorUser) => ({
  id:            apt._id,
  // Patient info (matches DoctorAppointmentsPage.jsx fields)
  patientId:     apt.patientId,
  patientName:   patientUser?.name  || 'Unknown',
  patientEmail:  patientUser?.email || '',
  patientPhone:  patientUser?.phone || '',
  // Doctor info (matches PatientDashboard / AppointmentBooking fields)
  doctorId:      apt.doctorId,
  doctorName:    doctorUser?.name   || 'Unknown',
  doctorEmail:   doctorUser?.email  || '',
  // Schedule
  date:          apt.date,
  time:          apt.time,
  duration:      apt.duration,
  type:          apt.type,
  // Details
  reason:        apt.reason,
  notes:         apt.notes,
  status:        apt.status,
  reminderSent:  apt.reminderSent,
  createdAt:     apt.createdAt,
  updatedAt:     apt.updatedAt
});

// ── Helper: bulk populate appointments ────────────────────────────────────
const populateAppointments = async (appointments) => {
  const patientIds = [...new Set(appointments.map(a => a.patientId?.toString()))];
  const doctorIds  = [...new Set(appointments.map(a => a.doctorId?.toString()))];

  const [patients, doctors] = await Promise.all([
    User.find({ _id: { $in: patientIds } }).select('name email phone'),
    User.find({ _id: { $in: doctorIds  } }).select('name email phone')
  ]);

  const patientMap = {};
  const doctorMap  = {};
  patients.forEach(u => { patientMap[u._id.toString()] = u; });
  doctors.forEach(u  => { doctorMap[u._id.toString()]  = u; });

  return appointments.map(a =>
    formatAppointment(a, patientMap[a.patientId?.toString()], doctorMap[a.doctorId?.toString()])
  );
};

// ── POST /api/appointments ─────────────────────────────────────────────────
// Patient books an appointment with a doctor (AppointmentBooking.jsx)
exports.createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, time, type, reason, notes, duration } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'doctorId, date, and time are required'
      });
    }

    // Verify doctor exists
    const doctorUser = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctorUser) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date: new Date(date),
      time,
      type:   type   || 'video',
      reason: reason || '',
      notes:  notes  || '',
      duration: duration || 30,
      status: 'scheduled'
    });

    const formatted = formatAppointment(appointment, req.user, doctorUser);
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/appointments ──────────────────────────────────────────────────
// Role-aware: patients see their own, doctors see their patients' appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctorId = req.user._id;
    }
    // admin sees all

    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .sort({ date: -1, time: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    const populated = await populateAppointments(appointments);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
      appointments: populated
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/appointments/:id ──────────────────────────────────────────────
exports.getAppointmentById = async (req, res, next) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Ensure user owns this appointment
    const isOwner =
      apt.patientId.toString() === req.user._id.toString() ||
      apt.doctorId.toString()  === req.user._id.toString()  ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const [patient, doctor] = await Promise.all([
      User.findById(apt.patientId).select('name email phone'),
      User.findById(apt.doctorId).select('name email phone')
    ]);

    res.status(200).json({
      success: true,
      data: formatAppointment(apt, patient, doctor)
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/appointments/:id ──────────────────────────────────────────────
// Doctor edits appointment details (DoctorAppointmentsPage edit modal)
exports.updateAppointment = async (req, res, next) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Only the doctor or admin can edit
    if (apt.doctorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { date, time, duration, type, reason, notes, status } = req.body;
    const updates = {
      ...(date     !== undefined && { date: new Date(date) }),
      ...(time     !== undefined && { time }),
      ...(duration !== undefined && { duration }),
      ...(type     !== undefined && { type }),
      ...(reason   !== undefined && { reason }),
      ...(notes    !== undefined && { notes }),
      ...(status   !== undefined && { status })
    };

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    const [patient, doctor] = await Promise.all([
      User.findById(updated.patientId).select('name email phone'),
      User.findById(updated.doctorId).select('name email phone')
    ]);

    res.status(200).json({
      success: true,
      message: 'Appointment updated',
      data: formatAppointment(updated, patient, doctor)
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/appointments/:id/status ────────────────────────────────────
// Doctor changes status: scheduled → in-progress → completed / cancelled
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const apt = await Appointment.findById(req.params.id);
    if (!apt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Patient can only cancel their own; doctor can change to any
    if (req.user.role === 'patient') {
      if (apt.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, error: 'Patients can only cancel appointments' });
      }
    } else if (req.user.role === 'doctor') {
      if (apt.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    apt.status = status;
    await apt.save();

    res.status(200).json({
      success: true,
      message: `Appointment marked as ${status}`,
      data: { id: apt._id, status: apt.status }
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/appointments/:id/reminder ──────────────────────────────────
// Doctor sends reminder to patient (DoctorAppointmentsPage "Send Reminder" button)
exports.sendReminder = async (req, res, next) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (apt.doctorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    apt.reminderSent = true;
    await apt.save();

    // TODO: send actual email/SMS when email service is set up
    res.status(200).json({
      success: true,
      message: 'Reminder sent to patient',
      data: { id: apt._id, reminderSent: true }
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/appointments/:id ───────────────────────────────────────────
// Permanently delete (cancelled appointments) or cancel active ones
exports.deleteAppointment = async (req, res, next) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const isOwner =
      apt.patientId.toString() === req.user._id.toString() ||
      apt.doctorId.toString()  === req.user._id.toString()  ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Soft delete: if already cancelled, permanently delete; otherwise just cancel
    if (apt.status === 'cancelled' || req.user.role === 'admin') {
      await Appointment.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Appointment permanently deleted' });
    }

    apt.status = 'cancelled';
    await apt.save();
    res.status(200).json({ success: true, message: 'Appointment cancelled', data: { id: apt._id, status: 'cancelled' } });
  } catch (error) {
    next(error);
  }
};