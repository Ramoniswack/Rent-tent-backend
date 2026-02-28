const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixBishalLocation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'baniya@baniya.baniya' });
    
    console.log('Before:');
    console.log('Location:', user.location);
    console.log('GeoLocation:', user.geoLocation?.coordinates);
    
    // Kathmandu coordinates: 27.7172° N, 85.3240° E
    user.geoLocation = {
      type: 'Point',
      coordinates: [85.3240, 27.7172] // [longitude, latitude]
    };
    
    // Increase location range to see more users
    if (!user.matchPreferences) {
      user.matchPreferences = {};
    }
    user.matchPreferences.locationRange = 500; // 500km range
    
    await user.save();
    
    console.log('\nAfter:');
    console.log('Location:', user.location);
    console.log('GeoLocation:', user.geoLocation.coordinates);
    console.log('Location Range:', user.matchPreferences.locationRange, 'km');
    console.log('\n✅ Fixed!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixBishalLocation();
