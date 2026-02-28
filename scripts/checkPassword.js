require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function checkPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'baniya@baniya.baniya' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('User found:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Password hash:', user.password);
    
    // Test password
    const testPassword = 'bishal1234';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    console.log('\nPassword test:');
    console.log('Testing password:', testPassword);
    console.log('Match:', isMatch ? '✅ YES' : '❌ NO');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPassword();
