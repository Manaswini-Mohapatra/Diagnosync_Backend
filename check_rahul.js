require('dotenv').config();
const mongoose = require('mongoose');

async function checkRahul() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const user = await db.collection('users').findOne({ email: 'rahul@test.com' });
  console.log("== USER ==");
  console.log(user);

  if (user) {
    const profile = await db.collection('patients').findOne({ userId: user._id });
    console.log("== PATIENT PROFILE ==");
    console.log(profile);
  }

  process.exit(0);
}

checkRahul().catch(console.error);
