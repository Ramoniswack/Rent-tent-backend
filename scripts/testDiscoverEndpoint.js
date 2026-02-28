const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testDiscoverEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a test user
    const user = await User.findOne();
    
    if (!user) {
      console.log('No users found in database');
      return;
    }

    console.log('\nTest User:', {
      id: user._id,
      name: user.name,
      email: user.email,
      hasGeoLocation: !!user.geoLocation,
      geoLocation: user.geoLocation,
      matchPreferences: user.matchPreferences
    });

    // Check if user has geolocation
    if (!user.geoLocation || !user.geoLocation.coordinates || user.geoLocation.coordinates.length !== 2) {
      console.log('\n❌ User does not have geolocation set!');
      console.log('Setting default location (New York)...');
      
      user.geoLocation = {
        type: 'Point',
        coordinates: [-74.006, 40.7128] // New York coordinates
      };
      
      await user.save();
      console.log('✅ Default location set successfully');
    } else {
      console.log('✅ User has geolocation set');
    }

    // Check other users
    const totalUsers = await User.countDocuments();
    const usersWithLocation = await User.countDocuments({
      'geoLocation.coordinates': { $exists: true, $ne: [] }
    });

    console.log(`\nTotal users: ${totalUsers}`);
    console.log(`Users with location: ${usersWithLocation}`);
    console.log(`Users without location: ${totalUsers - usersWithLocation}`);

    if (usersWithLocation < 2) {
      console.log('\n⚠️  Not enough users with locations for discovery to work properly');
      console.log('Consider running: node backend/scripts/seedTestUsers.js');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDiscoverEndpoint();
