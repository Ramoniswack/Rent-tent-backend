require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Match = require('../models/Match');

async function testMapData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Test trips with coordinates
    const tripsWithCoords = await Trip.find({
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null }
    });
    console.log(`✓ Trips with coordinates: ${tripsWithCoords.length}`);
    if (tripsWithCoords.length > 0) {
      console.log('  Sample trip:', {
        title: tripsWithCoords[0].title,
        destination: tripsWithCoords[0].destination,
        lat: tripsWithCoords[0].lat,
        lng: tripsWithCoords[0].lng,
        status: tripsWithCoords[0].status
      });
    }
    console.log('');

    // Test users with coordinates
    const usersWithCoords = await User.find({
      'coordinates.lat': { $exists: true, $ne: null },
      'coordinates.lng': { $exists: true, $ne: null }
    });
    console.log(`✓ Users with coordinates: ${usersWithCoords.length}`);
    if (usersWithCoords.length > 0) {
      console.log('  Sample user:', {
        name: usersWithCoords[0].name,
        location: usersWithCoords[0].location,
        coordinates: usersWithCoords[0].coordinates
      });
    }
    console.log('');

    // Test matches
    const matches = await Match.find({ matched: true })
      .populate('user1', 'name location coordinates')
      .populate('user2', 'name location coordinates');
    
    console.log(`✓ Total matches: ${matches.length}`);
    if (matches.length > 0) {
      console.log('  Sample match:');
      console.log('    User 1:', {
        name: matches[0].user1.name,
        location: matches[0].user1.location,
        coordinates: matches[0].user1.coordinates
      });
      console.log('    User 2:', {
        name: matches[0].user2.name,
        location: matches[0].user2.location,
        coordinates: matches[0].user2.coordinates
      });
    }
    console.log('');

    console.log('✅ Map data test complete!');
    console.log('\nSummary:');
    console.log(`  - ${tripsWithCoords.length} trips ready for map`);
    console.log(`  - ${usersWithCoords.length} users ready for map`);
    console.log(`  - ${matches.length} matches available`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMapData();
