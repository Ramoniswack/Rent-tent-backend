const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const users = await User.find({}).select('name email location geoLocation preferences.publicProfile');
    
    console.log(`Total users in database: ${users.length}\n`);
    console.log('Users:');
    console.log('='.repeat(70));
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Location: ${user.location || 'Not set'}`);
      console.log(`   GeoLocation: ${user.geoLocation?.coordinates ? 'Set' : 'Not set'}`);
      console.log(`   Public Profile: ${user.preferences?.publicProfile !== false ? 'Yes' : 'No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllUsers();
