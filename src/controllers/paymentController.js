const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid');

exports.createPayment = async (req, res, next) => {
  try {
    const { appointmentId, paymentMethod, amount } = req.body;

    // 1. Validate appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Ensure the patient making the payment is the appointment owner
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized payment attempt' });
    }

    // Check if appointment is already paid/scheduled
    if (appointment.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'This appointment is already paid or cancelled.' });
    }

    // 2. Simulate transaction processing
    // In a real application, you'd call Stripe/Razorpay SDK here.
    const transactionId = `TXN-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // 3. Create payment record
    const payment = await Payment.create({
      userId: req.user._id,
      appointmentId,
      doctorId: appointment.doctorId,
      amount,
      paymentMethod,
      status: 'success', // Simulated success
      transactionId
    });

    // 4. Update appointment status to 'scheduled'
    appointment.status = 'scheduled';
    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Payment successful',
      payment
    });

  } catch (error) {
    next(error);
  }
};
