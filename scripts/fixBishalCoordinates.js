const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixBishalCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const user = await User.findOne({ email: 'mr.bishal.baniya@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('Current coordinates:');
    console.log('   geoLocation:', user.geoLocation?.coordinates);
    console.log('   coordinates:', user.coordinates);
    console.log('');

    // The coordinates are swapped - should be [longitude, latitude]
    // Current: [85.394843855134, 27.71236832743816] (lat, lng)
    // Should be: [85.394843855134, 27.71236832743816] (lng, lat)
    
    // Actually, looking at Kathmandu coordinates:
    // Latitude: 27.7172
    // Longitude: 85.3240
    
    // So the current geoLocation has them backwards
    user.geoLocation = {
      type: 'Point',
      coordinates: [85.394843855134, 27.71236832743816] // [lng, lat]
    };

    // Also fix the regular coordinates object
    user.coordinates = {
      lat: 27.71236832743816,
      lng: 85.394843855134
    };

    await user.save();

    console.log('✅ Coordinates fixed!');
    console.log('New coordinates:');
    console.log('   geoLocation:', user.geoLocation.coordinates);
    console.log('   coordinates:', user.coordinates);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixBishalCoordinates();
