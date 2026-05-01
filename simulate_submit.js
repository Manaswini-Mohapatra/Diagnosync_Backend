const mongoose = require('mongoose');
const Patient = require('./src/models/Patient');
require('dotenv').config();

async function simulateSubmit() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  try {
    // Get the patient
    const patient = await Patient.findOne().sort({ updatedAt: -1 });
    
    // Simulate what the frontend payload would send if everything was filled out
    const payload = {
      age: "25",
      height: "180",
      weight: "75",
      bloodType: "A+",
      gender: "male",
      conditions: ["Asthma"],
      allergies: ["Peanuts"],
      medications: ["Inhaler"],
      familyHistory: "None",
      smokingStatus: "never",
      alcoholConsumption: "occasional",
      exerciseFrequency: "moderate",
      diet: "balanced",
      emergencyContact: "John Doe",
      emergencyPhone: "1234567890",
    };

    console.log("Simulating update with payload:", payload);
    
    // Apply updates using the exact logic from patientController.js
    if (payload.age !== undefined) patient.age = payload.age === "" ? null : payload.age;
    if (payload.height !== undefined) patient.height = payload.height === "" ? null : payload.height;
    if (payload.weight !== undefined) patient.weight = payload.weight === "" ? null : payload.weight;
    if (payload.bloodType !== undefined) patient.bloodType = payload.bloodType;
    if (payload.gender !== undefined) patient.gender = payload.gender;
    
    if (payload.conditions !== undefined) patient.medicalConditions = payload.conditions;
    if (payload.allergies !== undefined) patient.allergies = payload.allergies;
    if (payload.familyHistory !== undefined) patient.familyHistory = payload.familyHistory;
    if (payload.medications !== undefined) patient.medications = payload.medications;
    
    if (payload.smokingStatus !== undefined) patient.smokingStatus = payload.smokingStatus;
    if (payload.alcoholConsumption !== undefined) patient.alcoholConsumption = payload.alcoholConsumption;
    if (payload.exerciseFrequency !== undefined) patient.exerciseFrequency = payload.exerciseFrequency;
    if (payload.diet !== undefined) patient.diet = payload.diet;
    if (payload.emergencyContact !== undefined) patient.emergencyContact = payload.emergencyContact;
    if (payload.emergencyPhone !== undefined) patient.emergencyPhone = payload.emergencyPhone;

    await patient.save();
    console.log("Successfully saved with filled data!");
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error("VALIDATION ERROR CAUGHT:");
      console.error(Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`));
    } else {
      console.error("Other error:", error);
    }
  } finally {
    mongoose.disconnect();
  }
}

simulateSubmit();
