require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const DrugInteraction = require('./models/DrugInteraction');
const Medication = require('./models/Medication');
const connectDB = require('./database/connection');

const seedData = async () => {
  try {
    // Connect to the DB
    await connectDB();
    console.log('Connected to Database. Starting seed...');

    // Clear existing interactions to prevent duplicates
    await DrugInteraction.deleteMany({});
    console.log('Cleared old drug interaction data.');
    
    await Medication.deleteMany({});
    console.log('Cleared old medication data.');

    // Read the dataset
    const dataPath = path.join(__dirname, '../data/DDI Database.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const dataset = JSON.parse(rawData);

    const interactionsToInsert = [];
    const uniqueDrugs = new Set();
    
    // Helper to map and push interactions
    const processCategory = (categoryArray, defaultSeverity) => {
      if (!categoryArray) return;
      for (const item of categoryArray) {
        let prob = 0.5;
        if (defaultSeverity === 'major') prob = 0.8 + (Math.random() * 0.15);
        if (defaultSeverity === 'moderate') prob = 0.5 + (Math.random() * 0.25);
        if (defaultSeverity === 'minor') prob = 0.2 + (Math.random() * 0.2);

        const drug1 = item.drug_a || item.drug1;
        const drug2 = item.drug_b || item.drug2;

        uniqueDrugs.add(drug1);
        uniqueDrugs.add(drug2);

        interactionsToInsert.push({
          drug1,
          drug2,
          severity: (item.severity || defaultSeverity).toLowerCase(),
          probability: parseFloat(prob.toFixed(2)),
          description: item.effect || item.description || '',
          mechanism: item.mechanism || '',
          symptoms: [item.effect || 'Adverse reaction'],
          recommendation: item.rationale || item.recommendation || '',
          alternativeForDrug1: item.Safer_alternative || item.alternativeForDrug1 || ''
        });
      }
    };

    if (dataset.drug_interactions) {
      processCategory(dataset.drug_interactions.major, 'major');
      processCategory(dataset.drug_interactions.moderate, 'moderate');
      processCategory(dataset.drug_interactions.minor, 'minor');
    }

    if (interactionsToInsert.length === 0) {
      console.log('No valid interactions found to insert. Check dataset format.');
      process.exit(1);
    }

    // Insert interactions
    await DrugInteraction.insertMany(interactionsToInsert);
    console.log(`✅ Successfully seeded ${interactionsToInsert.length} drug interactions!`);

    // Insert unique medications
    const medicationsToInsert = Array.from(uniqueDrugs).map(name => ({
      name,
      genericName: name,
      form: 'tablet',
      availability: true
    }));
    await Medication.insertMany(medicationsToInsert);
    console.log(`✅ Successfully seeded ${medicationsToInsert.length} unique medications for autocomplete!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
