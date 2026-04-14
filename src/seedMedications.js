require('dotenv').config();
const mongoose = require('mongoose');
const Medication = require('./models/Medication');
const connectDB = require('./database/connection');

const mockMedications = [
  { name: 'Lisinopril', genericName: 'Lisinopril', form: 'tablet', dosage: '10mg', frequency: 'Daily' },
  { name: 'Aspirin', genericName: 'Acetylsalicylic Acid', form: 'tablet', dosage: '81mg', frequency: 'Daily' },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', form: 'capsule', dosage: '400mg', frequency: 'Every 6 hours' },
  { name: 'Acetaminophen', genericName: 'Paracetamol', form: 'tablet', dosage: '500mg', frequency: 'PRN (As needed)' },
  { name: 'Metformin', genericName: 'Metformin Hydrochloride', form: 'tablet', dosage: '500mg', frequency: 'Twice daily' },
  { name: 'Atorvastatin', genericName: 'Atorvastatin', form: 'tablet', dosage: '20mg', frequency: 'Daily at bedtime' },
  { name: 'Amoxicillin', genericName: 'Amoxicillin', form: 'capsule', dosage: '500mg', frequency: 'Three times daily' },
  { name: 'Vitamin C', genericName: 'Ascorbic Acid', form: 'tablet', dosage: '1000mg', frequency: 'Daily' },
  { name: 'Vitamin D', genericName: 'Cholecalciferol', form: 'capsule', dosage: '1000 IU', frequency: 'Daily' },
  { name: 'Calcium', genericName: 'Calcium Carbonate', form: 'tablet', dosage: '600mg', frequency: 'Daily' },
  { name: 'Methotrexate', genericName: 'Methotrexate', form: 'tablet', dosage: '2.5mg', frequency: 'Weekly' },
  { name: 'Azithromycin', genericName: 'Azithromycin', form: 'tablet', dosage: '250mg', frequency: 'Daily for 5 days' },
  { name: 'Sertraline', genericName: 'Sertraline', form: 'tablet', dosage: '50mg', frequency: 'Daily' },
  { name: "St. John's Wort", genericName: 'Hypericum perforatum', form: 'capsule', dosage: '300mg', frequency: 'Three times daily' },
  { name: 'Potassium Chloride', genericName: 'Potassium Chloride', form: 'tablet', dosage: '20mEq', frequency: 'Daily' }
];

const seedMedications = async () => {
  try {
    await connectDB();
    console.log('Connected to Database. Starting seed...');

    await Medication.deleteMany({});
    console.log('Cleared old medication data.');

    await Medication.insertMany(mockMedications);
    console.log(`✅ Successfully seeded ${mockMedications.length} medications!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding medications:', error);
    process.exit(1);
  }
};

seedMedications();
