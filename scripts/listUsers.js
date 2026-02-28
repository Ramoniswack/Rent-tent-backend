const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('name username email').limit(20);
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name}`);
      console.log(`   Username: @${user.username || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();
