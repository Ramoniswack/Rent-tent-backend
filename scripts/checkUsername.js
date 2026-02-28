const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function checkUsername() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the most recent user
    const recentUser = await User.findOne().sort({ createdAt: -1 });
    
    if (!recentUser) {
      console.log('No users found');
      return;
    }

    console.log('\nMost Recent User:');
    console.log('Name:', recentUser.name);
    console.log('Email:', recentUser.email);
    console.log('Username:', recentUser.username || 'NOT SET');
    console.log('Created:', recentUser.createdAt);

    // Check all users without usernames
    const usersWithoutUsername = await User.find({ 
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    }).select('name email username createdAt');

    console.log(`\nUsers without username: ${usersWithoutUsername.length}`);
    
    if (usersWithoutUsername.length > 0) {
      console.log('\nUsers missing usernames:');
      usersWithoutUsername.forEach(user => {
        console.log(`- ${user.name} (${user.email})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsername();
