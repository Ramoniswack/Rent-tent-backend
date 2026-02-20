const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function addGeoLocationToUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with coordinates but no geoLocation
    const users = await User.find({
      'coordinates.lat': { $exists: true },
      'coordinates.lng': { $exists: true },
      $or: [
        { geoLocation: { $exists: false } },
        { 'geoLocation.coordinates': { $exists: false } }
      ]
    });

    console.log(`Found ${users.length} users to update`);

    let updated = 0;
    for (const user of users) {
      if (user.coordinates && user.coordinates.lat && user.coordinates.lng) {
        // GeoJSON format: [longitude, latitude]
        user.geoLocation = {
          type: 'Point',
          coordinates: [user.coordinates.lng, user.coordinates.lat]
        };
        
        await user.save();
        updated++;
        console.log(`Updated user ${user.name} (${user.email})`);
      }
    }

    console.log(`\nSuccessfully updated ${updated} users with geoLocation`);
    
    // Create 2dsphere index if it doesn't exist
    await User.collection.createIndex({ geoLocation: '2dsphere' });
    console.log('Created 2dsphere index on geoLocation field');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
addGeoLocationToUsers();
