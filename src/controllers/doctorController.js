const mongoose = require('mongoose');
const Doctor   = require('../models/Doctor');
const User     = require('../models/User');
const Appointment = require('../models/Appointment');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { createSystemNotification } = require('./notificationController');

// ── Shared helper: find doctor by Doctor _id OR User _id ──────────────────
const findDoctorByAnyId = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  let doctor = await Doctor.findById(id);
  if (!doctor) doctor = await Doctor.findOne({ userId: id });
  return doctor;
};

// ── Helper: format a doctor+user into the shape AppointmentBooking.jsx expects ─
const formatDoctorForListing = (user, doctor) => ({
  id:         doctor._id,
  userId:     user._id,
  name:       user.name,           // populated from User model
  email:      user.email,
  phone:      user.phone,
  // AppointmentBooking expects singular 'specialty' string
  specialty:  doctor.specialties?.join(', ') || 'General Physician',
  specialties: doctor.specialties || [],
  // AppointmentBooking expects rating as string e.g. "4.8"
  rating:     doctor.ratings?.toFixed(1) || '0.0',
  // AppointmentBooking expects reviews as string e.g. "120"
  reviews:    String(doctor.reviewCount || 0),
  // AppointmentBooking expects fee as formatted string e.g. "$100"
  fee:        doctor.consultationFee ? `$${doctor.consultationFee}` : 'N/A',
  consultationFee: doctor.consultationFee,
  yearsOfExperience: doctor.yearsOfExperience,
  hospitalAffiliation: doctor.hospitalAffiliation,
  licenseNumber: doctor.licenseNumber,   // ← was missing — caused "Not specified" on profile page
  licenseState:  doctor.licenseState,    // ← was missing — caused "Not specified" on profile page
  languages:  doctor.languages || [],
  qualifications: doctor.qualifications || [],
  bio:        doctor.bio,
  isVerified: doctor.isVerified,
  verificationStatus: doctor.verificationStatus,
  availableSlots: doctor.availableSlots || {},
  documents: doctor.documents || []
});

// ── GET /api/doctors ───────────────────────────────────────────────────────
// AppointmentBooking Step 1 — patient picks a doctor from the list
exports.getAllDoctors = async (req, res, next) => {
  try {
    const { specialty, search, page = 1, limit = 20 } = req.query;

    // Filter doctor docs
    const doctorFilter = {};
    if (specialty) {
      doctorFilter.specialties = { $regex: specialty, $options: 'i' };
    }

    const doctors = await Doctor.find(doctorFilter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ ratings: -1 });   // highest rated first

    // Populate user names
    const userIds = doctors.map(d => d.userId);
    let userFilter = { _id: { $in: userIds }, isActive: true };
    if (search) {
      userFilter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(userFilter).select('-password');
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    // Combine + format for frontend
    const result = doctors
      .filter(d => userMap[d.userId.toString()])   // skip if user deleted/inactive
      .map(d => formatDoctorForListing(userMap[d.userId.toString()], d));

    const total = await Doctor.countDocuments(doctorFilter);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
      doctors: result
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/doctors/:id ───────────────────────────────────────────────────
// View a specific doctor's public profile.
// Accepts EITHER the Doctor document _id OR the User _id (both work).
exports.getDoctorById = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Validate ObjectId — MongoDB IDs are exactly 24 hex characters
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format. Use the doctor id from GET /api/doctors list.'
      });
    }

    const doctor = await findDoctorByAnyId(id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const user = await User.findById(doctor.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.status(200).json({
      success: true,
      data: formatDoctorForListing(user, doctor)
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/doctors/:id/slots?date=YYYY-MM-DD ─────────────────────────────
// AppointmentBooking Step 2 — get available time slots for a doctor on a date
// Accepts EITHER the Doctor document _id OR the User _id.
exports.getDoctorSlots = async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }

    const doctor = await findDoctorByAnyId(id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const { date } = req.query;

    let slots = [];
    if (date) {
      // 1. Check for date-specific slots (Override)
      // date is usually 'YYYY-MM-DD'
      if (doctor.availableSlots?.[date]) {
        slots = doctor.availableSlots[date];
      } else {
        // 2. Fallback to weekly schedule (Default)
        const dayName = new Date(date)
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();
        slots = doctor.availableSlots?.[dayName] || [];
      }

      // 3. Filter out ALREADY BOOKED slots for this day
      // Query appointments for this doctor on this date that aren't cancelled
      const bookedAppointments = await Appointment.find({
        doctorId: doctor.userId, // Controller uses userId for query consistency
        date: new Date(date),
        status: { $ne: 'cancelled' }
      }).select('time');

      const bookedTimes = bookedAppointments.map(a => a.time);
      
      // Remove any slot that matches a booked time
      slots = slots.filter(s => !bookedTimes.includes(s));
    } else {
      // No date provided — return all slots structure
      slots = doctor.availableSlots || {};
    }

    res.status(200).json({ success: true, date, slots });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/doctors/me ────────────────────────────────────────────────────
// DoctorProfilePage — fetch own full profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    res.status(200).json({
      success: true,
      data: formatDoctorForListing(req.user, doctor)
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/doctors/me ────────────────────────────────────────────────────
// DoctorRegistrationForm — save/update professional profile
exports.updateMyProfile = async (req, res, next) => {
  try {
    const {
      fullName, phone,
      licenseNumber, licenseState, hospitalAffiliation,
      yearsOfExperience, consultationFee,
      specialties, qualifications, languages,
      bio, availableSlots
    } = req.body;

    // Optional: Update base user fields
    if (fullName !== undefined || phone !== undefined) {
      const userUpdates = {};
      if (fullName !== undefined) userUpdates.name = fullName;
      if (phone !== undefined) userUpdates.phone = phone;
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(req.user._id, { $set: userUpdates });
      }
    }

    const updates = {
      ...(licenseNumber      !== undefined && { licenseNumber }),
      ...(licenseState       !== undefined && { licenseState }),
      ...(hospitalAffiliation !== undefined && { hospitalAffiliation }),
      ...(yearsOfExperience  !== undefined && { yearsOfExperience }),
      ...(consultationFee    !== undefined && { consultationFee }),
      ...(specialties        !== undefined && { specialties }),
      ...(qualifications     !== undefined && { qualifications }),
      ...(languages          !== undefined && { languages }),
      ...(bio                !== undefined && { bio }),
      ...(availableSlots     !== undefined && { availableSlots })
    };

    // Find existing doctor to check verification status
    let doctor = await Doctor.findOne({ userId: req.user._id });
    
    // If the profile was rejected, resetting it to pending so admin can re-verify
    if (doctor && doctor.verificationStatus === 'rejected') {
      updates.verificationStatus = 'pending';
    }

    doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: formatDoctorForListing(await User.findById(req.user._id), doctor)
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/doctors/me/documents ────────────────────────────────────────
// DoctorRegistrationForm Step 3 — upload document to Cloudinary
exports.addDocument = async (req, res, next) => {
  try {
    const { documentType, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

    // Graceful fallback for development without Cloudinary keys
    if (!process.env.CLOUDINARY_API_KEY) {
      console.warn("CLOUDINARY_API_KEY is not set. Using mock upload.");
      const mockDocument = {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        publicId: "mock_public_id_" + Date.now(),
        documentType: documentType || 'other',
        description: description || '',
        verified: false,
        uploadDate: Date.now()
      };
      const existingDoc = await Doctor.findOne({ userId: req.user._id });
      const updateObj = { $push: { documents: mockDocument } };
      if (existingDoc && existingDoc.verificationStatus === 'rejected') {
        updateObj.$set = { verificationStatus: 'pending' };
      }
      
      const doctor = await Doctor.findOneAndUpdate(
        { userId: req.user._id },
        updateObj,
        { new: true, upsert: true }
      );
      return res.status(201).json({
        success: true,
        message: 'Mock document uploaded',
        documents: doctor.documents
      });
    }

    // Pipeline buffer to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'diagnosync/doctor_docs',
        resource_type: 'auto'
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ success: false, error: 'Cloudinary upload failed' });
        }

        const newDoc = {
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          documentType,
          description,
          fileUrl: result.secure_url,
          publicId: result.public_id
        };

        const existingDoc = await Doctor.findOne({ userId: req.user._id });
        const updateObj = { $push: { documents: newDoc } };
        if (existingDoc && existingDoc.verificationStatus === 'rejected') {
          updateObj.$set = { verificationStatus: 'pending' };
        }

        const doctor = await Doctor.findOneAndUpdate(
          { userId: req.user._id },
          updateObj,
          { new: true, upsert: true }
        );

        res.status(201).json({
          success: true,
          message: 'Document uploaded successfully',
          documents: doctor.documents
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/doctors/me/documents/:docId ────────────────────────────────
// DoctorRegistrationForm — remove a document
exports.deleteDocument = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    // Find the specific document to delete from Cloudinary
    const docToDelete = doctor.documents.id(req.params.docId);
    if (docToDelete && docToDelete.publicId) {
      if (process.env.CLOUDINARY_API_KEY) {
        await cloudinary.uploader.destroy(docToDelete.publicId);
      }
    }

    // Remove from MongoDB
    doctor.documents.pull({ _id: req.params.docId });
    if (doctor.verificationStatus === 'rejected') {
      doctor.verificationStatus = 'pending';
    }
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Document removed from cloud and database',
      documents: doctor.documents
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/doctors/:id/verify (admin only) ────────────────────────────
// Admin updates the verification status of a doctor
exports.verifyDoctor = async (req, res, next) => {
  try {
    const { status } = req.body; // expected: 'verified', 'rejected', or 'pending'

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const doctorId = req.params.id;
    const doctor = await findDoctorByAnyId(doctorId);

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    doctor.verificationStatus = status;
    doctor.isVerified = status === 'verified';
    await doctor.save();

    if (status === 'rejected') {
      await createSystemNotification({
        userId: doctor.userId,
        type: 'alert',
        priority: 'high',
        title: 'Profile Verification Rejected',
        message: 'Your profile verification was rejected. Please review and re-upload the correct information and documents for approval.'
      });
    } else if (status === 'verified') {
      await createSystemNotification({
        userId: doctor.userId,
        type: 'alert',
        priority: 'medium',
        title: 'Profile Verification Approved',
        message: 'Congratulations! Your profile has been verified and approved by the admin. You now have full access to all doctor features.'
      });
    }

    res.status(200).json({
      success: true,
      message: `Doctor verification status updated to ${status}`,
      doctor
    });
  } catch (error) {
    next(error);
  }
};