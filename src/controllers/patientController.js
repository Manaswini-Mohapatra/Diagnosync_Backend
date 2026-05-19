const Patient = require('../models/Patient');
const User    = require('../models/User');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

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

  profile: patient ? (patient.toObject ? patient.toObject() : patient) : null
});

//Health score
const calculateHealthScore = (patient) => {
  let score = 100;
  let bmiPenalty = 0, diseasePenalty = 0, allergyPenalty = 0;
  let familyHistoryPenalty = 0, smokingPenalty = 0, exercisePenalty = 0;
  let bmi = 0;

  //  BMI
  if (patient.height && patient.weight) {
    const heightM = patient.height / 100;
    bmi = Number((patient.weight / (heightM * heightM)).toFixed(1));
    if (bmi < 18.5 || bmi > 25) {
      bmiPenalty = 10;
      score -= bmiPenalty;
    }
  }

  //  Diseases
  if (patient.medicalConditions && patient.medicalConditions.length > 0) {
    const conds = patient.medicalConditions.map(c => c.toLowerCase());
    if (conds.includes('diabetes')) diseasePenalty += 15;
    if (conds.includes('heart disease')) diseasePenalty += 20;
    if (conds.includes('high blood pressure')) diseasePenalty += 10;
    score -= diseasePenalty;
  }

  //  Allergies
  if (patient.allergies && patient.allergies.length > 0) {
    allergyPenalty = patient.allergies.length * 2;
    score -= allergyPenalty;
  }

  //  Family History
  if (patient.familyHistory) {
    const fh = patient.familyHistory.toLowerCase();
    if (fh.includes('heart disease')) familyHistoryPenalty += 10;
    if (fh.includes('diabetes')) familyHistoryPenalty += 5;
    if (fh.includes('hypertension')) familyHistoryPenalty += 5;
    score -= familyHistoryPenalty;
  }

  //  Smoking
  if (patient.smokingStatus) {
    if (patient.smokingStatus === 'current') { smokingPenalty = 5; score -= smokingPenalty; }
    else if (patient.smokingStatus === 'former') { smokingPenalty = 2; score -= smokingPenalty; }
    else if (patient.smokingStatus === 'never') { smokingPenalty = -10; score -= smokingPenalty; } // -(-10) = +10
  }

  //  Exercise
  if (patient.exerciseFrequency) {
    if (patient.exerciseFrequency === 'sedentary') { exercisePenalty = 10; score -= exercisePenalty; }
    else if (patient.exerciseFrequency === 'light') { exercisePenalty = 5; score -= exercisePenalty; }
    else if (patient.exerciseFrequency === 'vigorous') { exercisePenalty = -10; score -= exercisePenalty; } 
  }

  //  Age adjustment
  let agePenalty = 0;
  if (patient.age) {
    if (patient.age < 30)      agePenalty = -5;  
    else if (patient.age < 45) agePenalty = 0;   
    else if (patient.age < 60) agePenalty = 2;  
    else if (patient.age < 75) agePenalty = 4;  
    else                        agePenalty = 5;  
    score -= agePenalty;
  }

  //  Score
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


exports.getMyProfile = async (req, res, next) => {
  try {
    let patient = await Patient.findOne({ userId: req.user._id });
    

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


exports.updateMyProfile = async (req, res, next) => {
  try {
    const {
      age, height, weight, bloodType, gender, dateOfBirth,
      conditions,          
      medicalConditions,  
      allergies, surgeries, familyHistory, medications,
      smokingStatus, alcoholConsumption, exerciseFrequency, diet,
      emergencyContact, emergencyPhone
    } = req.body;

    let patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) patient = new Patient({ userId: req.user._id });

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


exports.getAllPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;


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


exports.uploadReport = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    if (!title) {
      return res.status(400).json({ success: false, error: 'Report title is required' });
    }

    // Upload to Cloudinary using a stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `diagnosync/patients/${req.user._id}`,
        resource_type: 'auto'
      },
      async (cloudErr, result) => {
        if (cloudErr) {
          console.error('Cloudinary Upload Error:', cloudErr);
          return res.status(500).json({ success: false, error: 'Error uploading file to storage' });
        }

        try {
          const newReport = {
            title,
            fileUrl: result.secure_url,
            fileType: result.format || req.file.mimetype.split('/')[1] || 'unknown',
            publicId: result.public_id,
            uploadedAt: new Date()
          };


          const updated = await Patient.findOneAndUpdate(
            { userId: req.user._id },
            { $push: { reports: newReport } },
            { new: true, upsert: true }
          );

          const saved = updated.reports[updated.reports.length - 1];

          return res.status(201).json({ success: true, data: saved });
        } catch (saveErr) {
          console.error('DB save error after Cloudinary upload:', saveErr);
          return res.status(500).json({ success: false, error: 'File uploaded but failed to save record.' });
        }
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    next(error);
  }
};


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

    if (report.publicId) {
      try {
        if (process.env.CLOUDINARY_API_KEY) {
          await cloudinary.uploader.destroy(report.publicId);
        }
      } catch (cloudErr) {
        console.error("Cloudinary Deletion Error:", cloudErr);
      }
    }

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