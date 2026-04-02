const Patient = require('../models/Patient');
const User    = require('../models/User');

// ── Helper: build safe user+profile response ───────────────────────────────
const buildProfile = (user, patient) => ({
  user: {
    _id:           user._id,
    name:          user.name,
    email:         user.email,
    phone:         user.phone,
    role:          user.role,
    emailVerified: user.emailVerified,
    createdAt:     user.createdAt
  },
  profile: patient || null
});

// ── GET /api/patients/me ───────────────────────────────────────────────────
// PatientProfilePage — fetch own profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    res.status(200).json({
      success: true,
      data: buildProfile(req.user, patient)
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/patients/me ───────────────────────────────────────────────────
// PatientRegistrationForm — save/update extended health profile
// Frontend field 'conditions' is mapped to 'medicalConditions'
exports.updateMyProfile = async (req, res, next) => {
  try {
    const {
      height, weight, bloodType, gender, dateOfBirth,
      conditions,          // frontend sends 'conditions'
      medicalConditions,   // also accept direct field name
      allergies, surgeries, familyHistory, medications,
      smokingStatus, alcoholConsumption, exerciseFrequency, diet,
      emergencyContact, emergencyPhone
    } = req.body;

    const updates = {
      ...(height            !== undefined && { height }),
      ...(weight            !== undefined && { weight }),
      ...(bloodType         !== undefined && { bloodType }),
      ...(gender            !== undefined && { gender }),
      ...(dateOfBirth       !== undefined && { dateOfBirth }),
      // Accept either field name from frontend
      ...(conditions        !== undefined && { medicalConditions: conditions }),
      ...(medicalConditions !== undefined && { medicalConditions }),
      ...(allergies         !== undefined && { allergies }),
      ...(surgeries         !== undefined && { surgeries }),
      ...(familyHistory     !== undefined && { familyHistory }),
      ...(medications       !== undefined && { medications }),
      ...(smokingStatus     !== undefined && { smokingStatus }),
      ...(alcoholConsumption !== undefined && { alcoholConsumption }),
      ...(exerciseFrequency !== undefined && { exerciseFrequency }),
      ...(diet              !== undefined && { diet }),
      ...(emergencyContact  !== undefined && { emergencyContact }),
      ...(emergencyPhone    !== undefined && { emergencyPhone })
    };

    // Upsert — create if doesn't exist yet
    const patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Health profile updated successfully',
      data: buildProfile(req.user, patient)
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/patients ──────────────────────────────────────────────────────
// PatientList.jsx — doctor sees their patients (patients who booked with them)
// For MVP: returns all patients with basic User info
exports.getAllPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Build user search filter
    const userFilter = { role: 'patient', isActive: true };
    if (search) {
      userFilter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(userFilter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ name: 1 });

    // Fetch patient profiles for these users
    const userIds = users.map(u => u._id);
    const profiles = await Patient.find({ userId: { $in: userIds } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

    const patients = users.map(u => ({
      _id:       u._id,
      name:      u.name,
      email:     u.email,
      phone:     u.phone,
      createdAt: u.createdAt,
      profile:   profileMap[u._id.toString()] || null
    }));

    const total = await User.countDocuments(userFilter);

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
      patients
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/patients/:id ──────────────────────────────────────────────────
// Doctor views a specific patient's full profile
exports.getPatientById = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id:    req.params.id,
      role:   'patient',
      isActive: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const patient = await Patient.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      data: buildProfile(user, patient)
    });
  } catch (error) {
    next(error);
  }
};