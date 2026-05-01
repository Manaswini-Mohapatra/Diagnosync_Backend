const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: './.env' });

const User = require('./models/User');
const connectDB = require('./database/connection');

// Connect to DB
connectDB();

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@diagnosync.com';
    const adminPassword = 'AdminPassword123!';

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists!');
      process.exit();
    }

    // Create admin user (password is hashed automatically by User model pre-save hook)
    admin = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: '1234567890'
    });

    console.log(`Admin user created successfully!`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
