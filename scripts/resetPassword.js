// Script to reset user password
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function resetPassword(email, newPassword) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('\nAvailable users:');
      const users = await User.find().select('email');
      users.forEach(u => console.log(`  - ${u.email}`));
      process.exit(1);
    }

    // Hash new password
    // Note: Don't hash here because the User model pre-save hook will hash it
    
    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log('✅ Password reset successfully!\n');
    console.log('User Details:');
    console.log('='.repeat(50));
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('New Password:', newPassword);
    console.log('='.repeat(50));
    console.log('\n⚠️  Keep this password secure!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node resetPassword.js <email> <new-password>');
  console.log('Example: node resetPassword.js user@example.com NewPassword123');
  process.exit(1);
}

resetPassword(email, password);
