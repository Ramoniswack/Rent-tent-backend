// Script to create an admin user
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin credentials
    const adminData = {
      name: 'Admin',
      email: 'admin@nomadnotes.com',
      username: 'admin',
      password: 'Admin@123456' // Change this!
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('Email:', adminData.email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    const admin = new User({
      name: adminData.name,
      email: adminData.email,
      username: adminData.username,
      password: hashedPassword
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
