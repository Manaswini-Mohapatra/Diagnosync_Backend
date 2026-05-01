const mongoose = require('mongoose');
const Patient = require('./src/models/Patient');
require('dotenv').config();

async function testValidation() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  try {
    const patient = new Patient({
      userId: new mongoose.Types.ObjectId(),
      age: null,
      height: null,
      weight: null,
      bloodType: "",
      gender: "",
      medicalConditions: [],
      allergies: [],
      medications: [],
      familyHistory: "",
      smokingStatus: "",
      alcoholConsumption: "",
      exerciseFrequency: "",
      diet: "",
      emergencyContact: "",
      emergencyPhone: ""
    });
    
    await patient.validate();
    console.log("Validation successful");
  } catch (error) {
    console.error("Validation error details:");
    console.error(Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`));
  } finally {
    mongoose.disconnect();
  }
}

testValidation();
