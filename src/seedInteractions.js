require('dotenv').config();
const mongoose = require('mongoose');
const DrugInteraction = require('./models/DrugInteraction');
const connectDB = require('./database/connection');

const mockInteractions = [
  {
    drug1: 'Amoxicillin',
    drug2: 'Methotrexate',
    severity: 'major',
    probability: 0.8,
    description: 'Amoxicillin may decrease the excretion rate of Methotrexate which could result in a higher serum level.',
    mechanism: 'Competitive inhibition of renal tubular secretion',
    symptoms: ['Nausea', 'Vomiting', 'Mouth sores', 'Fatigue'],
    recommendation: 'Monitor patient closely for methotrexate toxicity. Consider reducing methotrexate dose if coadministration is necessary.',
    alternativeForDrug1: 'Azithromycin'
  },
  {
    drug1: 'Ibuprofen',
    drug2: 'Aspirin',
    severity: 'moderate',
    probability: 0.6,
    description: 'Ibuprofen may decrease the cardioprotective effect of low-dose aspirin.',
    mechanism: 'Competitive binding to COX-1 enzyme',
    symptoms: ['Reduced cardioprotection'],
    recommendation: 'Take ibuprofen at least 8 hours before or 30 minutes after taking immediate-release aspirin.',
    alternativeForDrug1: 'Acetaminophen'
  },
  {
    drug1: 'Sertraline',
    drug2: 'St. John\'s Wort',
    severity: 'major',
    probability: 0.9,
    description: 'Concurrent use increases the risk of serotonin syndrome.',
    mechanism: 'Synergistic excessive serotonergic activity',
    symptoms: ['Confusion', 'Agitation', 'Muscle twitching', 'Sweating', 'Shivering'],
    recommendation: 'Strictly avoid this combination.',
    alternativeForDrug2: 'Seek professional medical treatment for depression'
  },
  {
    drug1: 'Lisinopril',
    drug2: 'Potassium Chloride',
    severity: 'major',
    probability: 0.7,
    description: 'Risk of hyperkalemia (high blood potassium) is significantly increased.',
    mechanism: 'ACE inhibitors like Lisinopril decrease aldosterone production, reducing potassium excretion.',
    symptoms: ['Irregular heartbeat', 'Muscle weakness', 'Numbness'],
    recommendation: 'Monitor serum potassium frequently. Avoid routine use of potassium supplements with ACE inhibitors unless strictly necessary.'
  }
];

const seedData = async () => {
  try {
    // Connect to the DB
    await connectDB();
    console.log('Connected to Database. Starting seed...');

    // Clear existing interactions to prevent duplicates if you run this multiple times
    await DrugInteraction.deleteMany({});
    console.log('Cleared old drug interaction data.');

    // Insert new data
    await DrugInteraction.insertMany(mockInteractions);
    console.log(`✅ Successfully seeded ${mockInteractions.length} drug interactions!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
