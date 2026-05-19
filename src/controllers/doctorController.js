const mongoose = require('mongoose');
const Doctor   = require('../models/Doctor');
const User     = require('../models/User');
const Appointment = require('../models/Appointment');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { createSystemNotification } = require('./notificationController');


const findDoctorByAnyId = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  let doctor = await Doctor.findById(id);
  if (!doctor) doctor = await Doctor.findOne({ userId: id });
  return doctor;
};


const formatDoctorForListing = (user, doctor) => ({
  id:         doctor._id,
  userId:     user._id,
  name:       user.name,          
  email:      user.email,
  phone:      user.phone,
  specialty:  doctor.specialties?.join(', ') || 'General Physician',
  specialties: doctor.specialties || [],
  rating:     doctor.ratings?.toFixed(1) || '0.0',
  reviews:    String(doctor.reviewCount || 0),
  fee:        doctor.consultationFee ? `$${doctor.consultationFee}` : 'N/A',
  consultationFee: doctor.consultationFee,
  yearsOfExperience: doctor.yearsOfExperience,
  hospitalAffiliation: doctor.hospitalAffiliation,
  licenseNumber: doctor.licenseNumber,
  licenseState:  doctor.licenseState,
  languages:  doctor.languages || [],
  qualifications: doctor.qualifications || [],
  bio:        doctor.bio,
  isVerified: doctor.isVerified,
  verificationStatus: doctor.verificationStatus,
  availableSlots: doctor.availableSlots || {},
  documents: doctor.documents || []
});


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
      .sort({ ratings: -1 });

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

    const result = doctors
      .filter(d => userMap[d.userId.toString()])
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


exports.getDoctorById = async (req, res, next) => {
  try {
    const id = req.params.id;

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
      if (doctor.availableSlots?.[date]) {
        slots = doctor.availableSlots[date];
      } else {
        const dayName = new Date(date)
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();
        slots = doctor.availableSlots?.[dayName] || [];
      }

      const bookedAppointments = await Appointment.find({
        doctorId: doctor.userId,
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


exports.updateMyProfile = async (req, res, next) => {
  try {
    const {
      fullName, phone,
      licenseNumber, licenseState, hospitalAffiliation,
      yearsOfExperience, consultationFee,
      specialties, qualifications, languages,
      bio, availableSlots
    } = req.body;

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

    let doctor = await Doctor.findOne({ userId: req.user._id });
    
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


exports.addDocument = async (req, res, next) => {
  try {
    const { documentType, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

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


exports.deleteDocument = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    const docToDelete = doctor.documents.id(req.params.docId);
    if (docToDelete && docToDelete.publicId) {
      if (process.env.CLOUDINARY_API_KEY) {
        await cloudinary.uploader.destroy(docToDelete.publicId);
      }
    }

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


exports.verifyDoctor = async (req, res, next) => {
  try {
    const { status } = req.body;

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