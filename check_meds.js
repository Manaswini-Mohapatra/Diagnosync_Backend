require('dotenv').config();
const mongoose = require('mongoose');

async function checkMedications() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const count = await db.collection('medications').countDocuments();
  console.log(`Total medications: ${count}`);

  const meds = await db.collection('medications').find().limit(5).toArray();
  console.log("== SAMPLE MEDICATIONS ==");
  console.dir(meds, { depth: null });

  process.exit(0);
}

checkMedications().catch(console.error);
