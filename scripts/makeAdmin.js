// Script to make a user an admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Email to make admin
    const email = 'baniya@baniya.baniya';

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email ${email} not found!`);
      console.log('Please make sure the user is registered first.');
      process.exit(1);
    }

    // Check if already admin
    if (user.isAdmin) {
      console.log(`✅ User ${email} is already an admin!`);
      process.exit(0);
    }

    // Make admin
    user.isAdmin = true;
    await user.save();

    console.log('✅ User successfully made admin!');
    console.log('');
    console.log('Admin Details:');
    console.log('==================');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Username:', user.username || 'Not set');
    console.log('Admin Status:', user.isAdmin);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  }
}

makeAdmin();
