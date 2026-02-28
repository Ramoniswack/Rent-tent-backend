// Script to setup admin user - makes baniya@baniya.baniya an admin
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    const adminEmail = 'baniya@baniya.baniya';

    // Check if user exists
    let user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.log(`📝 User ${adminEmail} not found. Creating new user...`);
      
      // Create the user
      const hashedPassword = await bcrypt.hash('baniya123', 10);
      user = new User({
        name: 'Admin Baniya',
        email: adminEmail,
        username: 'adminbaniya',
        password: hashedPassword,
        isAdmin: true
      });
      
      await user.save();
      console.log('✅ Admin user created successfully!');
    } else {
      // User exists, just make them admin
      if (user.isAdmin) {
        console.log(`✅ User ${adminEmail} is already an admin!`);
      } else {
        user.isAdmin = true;
        await user.save();
        console.log(`✅ User ${adminEmail} has been made an admin!`);
      }
    }

    console.log('');
    console.log('Admin Credentials:');
    console.log('==================');
    console.log('Email:', adminEmail);
    console.log('Password:', user.isNew ? 'baniya123' : '(existing password)');
    console.log('Admin Status:', user.isAdmin);
    console.log('');
    console.log('🎉 Admin setup complete!');
    console.log('');
    console.log('You can now:');
    console.log('1. Login at http://localhost:3000/login');
    console.log('2. Access admin panel at http://localhost:3000/admin');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();
