const mongoose = require('mongoose');
const Doctor   = require('../models/Doctor');
const User     = require('../models/User');
const Appointment = require('../models/Appointment');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

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
      licenseNumber, licenseState, hospitalAffiliation,
      yearsOfExperience, consultationFee,
      specialties, qualifications, languages,
      bio, availableSlots
    } = req.body;

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

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: formatDoctorForListing(req.user, doctor)
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

        const doctor = await Doctor.findOneAndUpdate(
          { userId: req.user._id },
          { $push: { documents: newDoc } },
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
      await cloudinary.uploader.destroy(docToDelete.publicId);
    }

    // Remove from MongoDB
    doctor.documents.pull({ _id: req.params.docId });
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