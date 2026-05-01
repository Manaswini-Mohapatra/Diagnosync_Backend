const mongoose = require('mongoose');
const Patient = require('./src/models/Patient');
const User = require('./src/models/User');
require('dotenv').config();

async function checkDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  try {
    // Find the most recently updated patient
    const patient = await Patient.findOne().sort({ updatedAt: -1 }).populate('userId');
    if (patient) {
      console.log("Found Patient ID:", patient._id);
      console.log("User Email:", patient.userId.email);
      console.log("Patient Profile Data:", JSON.stringify(patient.toObject(), null, 2));
    } else {
      console.log("No patient profiles found in DB.");
    }
  } catch (error) {
    console.error("Error reading DB:", error);
  } finally {
    mongoose.disconnect();
  }
}

checkDB();
