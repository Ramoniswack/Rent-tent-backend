const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUserPreferences() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'baniya@baniya.baniya' });
    
    console.log('User:', user.name);
    console.log('Location:', user.location);
    console.log('GeoLocation:', user.geoLocation?.coordinates);
    console.log('\nMatch Preferences:');
    console.log(JSON.stringify(user.matchPreferences, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserPreferences();
