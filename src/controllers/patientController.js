const Patient = require('../models/Patient');
const User    = require('../models/User');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

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
  // Convert Mongoose doc → plain object so all fields (incl. reports[]) serialize correctly
  profile: patient ? (patient.toObject ? patient.toObject() : patient) : null
});

// ── Helper: Calculate Health Score ─────────────────────────────────────────
const calculateHealthScore = (patient) => {
  let score = 100;
  let bmiPenalty = 0, diseasePenalty = 0, allergyPenalty = 0;
  let familyHistoryPenalty = 0, smokingPenalty = 0, exercisePenalty = 0;
  let bmi = 0;

  // 1. BMI
  if (patient.height && patient.weight) {
    const heightM = patient.height / 100;
    bmi = Number((patient.weight / (heightM * heightM)).toFixed(1));
    if (bmi < 18.5 || bmi > 25) {
      bmiPenalty = 10;
      score -= bmiPenalty;
    }
  }

  // 2. Diseases
  if (patient.medicalConditions && patient.medicalConditions.length > 0) {
    const conds = patient.medicalConditions.map(c => c.toLowerCase());
    if (conds.includes('diabetes')) diseasePenalty += 15;
    if (conds.includes('heart disease')) diseasePenalty += 20;
    if (conds.includes('high blood pressure')) diseasePenalty += 10;
    score -= diseasePenalty;
  }

  // 3. Allergies
  if (patient.allergies && patient.allergies.length > 0) {
    allergyPenalty = patient.allergies.length * 2;
    score -= allergyPenalty;
  }

  // 4. Family History
  if (patient.familyHistory) {
    const fh = patient.familyHistory.toLowerCase();
    if (fh.includes('heart disease')) familyHistoryPenalty += 10;
    if (fh.includes('diabetes')) familyHistoryPenalty += 5;
    if (fh.includes('hypertension')) familyHistoryPenalty += 5;
    score -= familyHistoryPenalty;
  }

  // 5. Smoking
  if (patient.smokingStatus) {
    if (patient.smokingStatus === 'current') { smokingPenalty = 5; score -= smokingPenalty; }
    else if (patient.smokingStatus === 'former') { smokingPenalty = 2; score -= smokingPenalty; }
    else if (patient.smokingStatus === 'never') { smokingPenalty = -10; score -= smokingPenalty; } // -(-10) = +10
  }

  // 6. Exercise
  if (patient.exerciseFrequency) {
    if (patient.exerciseFrequency === 'sedentary') { exercisePenalty = 10; score -= exercisePenalty; }
    else if (patient.exerciseFrequency === 'light') { exercisePenalty = 5; score -= exercisePenalty; }
    else if (patient.exerciseFrequency === 'vigorous') { exercisePenalty = -10; score -= exercisePenalty; } // -(-10) = +10
  }

  // 7. Age adjustment (max ±5 points)
  let agePenalty = 0;
  if (patient.age) {
    if (patient.age < 30)      agePenalty = -5;  // youth bonus +5
    else if (patient.age < 45) agePenalty = 0;   // neutral
    else if (patient.age < 60) agePenalty = 2;   // mild: -2
    else if (patient.age < 75) agePenalty = 4;   // moderate: -4
    else                        agePenalty = 5;  // senior: -5
    score -= agePenalty;
  }

  // Clamp Score
  score = Math.max(0, Math.min(score, 100));

  let status = 'Critical';
  if (score >= 80) status = 'Good';
  else if (score >= 50) status = 'Moderate';

  return {
    score,
    status,
    bmi,
    breakdown: {
      bmiPenalty,
      diseasePenalty,
      allergyPenalty,
      familyHistoryPenalty,
      smokingPenalty,
      exercisePenalty,
      agePenalty
    }
  };
};

// ── GET /api/patients/me ───────────────────────────────────────────────────
// PatientProfilePage — fetch own profile
exports.getMyProfile = async (req, res, next) => {
  try {
    let patient = await Patient.findOne({ userId: req.user._id });
    
    // dynamically ensure health score exists
    if (patient && (!patient.healthScore || patient.healthScore.status === 'None')) {
      patient.healthScore = calculateHealthScore(patient);
      await patient.save();
    }

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
      age, height, weight, bloodType, gender, dateOfBirth,
      conditions,          // frontend sends 'conditions'
      medicalConditions,   // also accept direct field name
      allergies, surgeries, familyHistory, medications,
      smokingStatus, alcoholConsumption, exerciseFrequency, diet,
      emergencyContact, emergencyPhone
    } = req.body;

    let patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) patient = new Patient({ userId: req.user._id });

    // Apply updates
    if (age !== undefined) patient.age = age === "" ? null : age;
    if (height !== undefined) patient.height = height === "" ? null : height;
    if (weight !== undefined) patient.weight = weight === "" ? null : weight;
    if (bloodType !== undefined) patient.bloodType = bloodType;
    if (gender !== undefined) patient.gender = gender;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    
    if (conditions !== undefined) patient.medicalConditions = conditions;
    if (medicalConditions !== undefined) patient.medicalConditions = medicalConditions;
    if (allergies !== undefined) patient.allergies = allergies;
    if (surgeries !== undefined) patient.surgeries = surgeries;
    if (familyHistory !== undefined) patient.familyHistory = familyHistory;
    if (medications !== undefined) patient.medications = medications;
    if (smokingStatus !== undefined) patient.smokingStatus = smokingStatus;
    if (alcoholConsumption !== undefined) patient.alcoholConsumption = alcoholConsumption;
    if (exerciseFrequency !== undefined) patient.exerciseFrequency = exerciseFrequency;
    if (diet !== undefined) patient.diet = diet;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;
    if (emergencyPhone !== undefined) patient.emergencyPhone = emergencyPhone;

    // Calculate score with updated data
    patient.healthScore = calculateHealthScore(patient);

    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Health profile updated successfully',
      data: buildProfile(req.user, patient)
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error('Validation Error Details:', Object.values(error.errors).map(e => e.message));
    } else {
      console.error('Profile Update Error:', error);
    }
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

// ── POST /api/patients/me/reports ──────────────────────────────────────────
// Uploads a report to Cloudinary and saves URL in patient profile
exports.uploadReport = async (req, res, next) => {
  try {
    const { title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    if (!title) {
      return res.status(400).json({ success: false, error: 'Report title is required' });
    }

    let patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      patient = new Patient({ userId: req.user._id });
    }

    // Graceful fallback for development without Cloudinary keys
    if (!process.env.CLOUDINARY_API_KEY) {
      console.warn("CLOUDINARY_API_KEY is not set. Using mock upload for patient report.");
      const mockReport = {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        publicId: "mock_public_id_" + Date.now(),
        reportType: reportType || 'other',
        description: description || '',
        date: date ? new Date(date) : new Date(),
        uploadDate: Date.now()
      };
      const patient = await Patient.findOneAndUpdate(
        { userId: req.user._id },
        { $push: { reports: mockReport } },
        { new: true, upsert: true }
      );
      return res.status(201).json({
        success: true,
        message: 'Mock report uploaded successfully',
        reports: patient.reports
      });
    }

    // Upload to Cloudinary using a stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `diagnosync/patients/${req.user._id}`,
        // auto-detect type to support both images and raw PDFs
        resource_type: 'auto' 
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ success: false, error: 'Error uploading file' });
        }

        // Add to patient reports
        patient.reports.push({
          title: title,
          fileUrl: result.secure_url,
          fileType: result.format || 'unknown',
          publicId: result.public_id,
          uploadedAt: new Date()
        });

        await patient.save();

        res.status(201).json({
          success: true,
          data: patient.reports[patient.reports.length - 1]
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/patients/me/reports/:reportId ──────────────────────────────
// Permanently removes a report from MongoDB and Cloudinary
exports.deleteReport = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    const report = patient.reports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // 1. Delete from Cloudinary if publicId exists
    if (report.publicId) {
      try {
        if (process.env.CLOUDINARY_API_KEY) {
          await cloudinary.uploader.destroy(report.publicId);
        }
      } catch (cloudErr) {
        console.error("Cloudinary Deletion Error:", cloudErr);
        // Continue anyway to keep DB in sync
      }
    }

    // 2. Remove from Mongoose array
    patient.reports.pull(req.params.reportId);
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};