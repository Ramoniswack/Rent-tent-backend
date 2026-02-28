const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function resetMatchesAndFixLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // 1. Delete all matches for Bishal to reset
    const bishal = await User.findOne({ email: 'baniya@baniya.baniya' });
    const deleteResult = await Match.deleteMany({
      $or: [
        { user1: bishal._id },
        { user2: bishal._id }
      ]
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} matches for Bishal\n`);

    // 2. Fix locations for Nepal users
    const nepalUsers = [
      { email: 'baniya@baniya.baniya', coords: [85.3240, 27.7172] }, // Kathmandu
      { email: 'yamrish654@gmail.com', coords: [85.5597, 26.8597] }, // Malangawa
      { email: 'sushkunwar7266@gmail.com', coords: [85.3240, 27.7172] }, // Kathmandu
      { email: 'mr.bishal.baniya@gmail.com', coords: [85.3240, 27.7172] }, // Kathmandu
      { email: 'launashrestha@gmail.com', coords: [85.3240, 27.7172] } // Kathmandu
    ];

    console.log('Fixing Nepal user locations:');
    for (const userData of nepalUsers) {
      const user = await User.findOne({ email: userData.email });
      if (user) {
        user.geoLocation = {
          type: 'Point',
          coordinates: userData.coords
        };
        await user.save();
        console.log(`  ✅ ${user.name} - ${userData.coords}`);
      }
    }

    // 3. Fix locations for NY users
    const nyUsers = [
      { email: 'soniklamsal111@gmail.com', coords: [-73.9712, 40.7831] }, // Manhattan
      { email: 'ramontiwari086@gmail.com', coords: [-73.7949, 40.7282] }, // Queens
      { email: 'sushmitakunwar7266@gmail.com', coords: [-73.9712, 40.7831] }, // Upper West Side
      { email: 'ashis@gmail.com', coords: [-73.9857, 40.7282] } // East Village
    ];

    console.log('\nFixing NY user locations:');
    for (const userData of nyUsers) {
      const user = await User.findOne({ email: userData.email });
      if (user) {
        user.geoLocation = {
          type: 'Point',
          coordinates: userData.coords
        };
        await user.save();
        console.log(`  ✅ ${user.name} - ${userData.coords}`);
      }
    }

    console.log('\n✅ All locations fixed!');
    console.log('\nNow Bishal should see:');
    console.log('- Discover: 4 Nepal users + 4 NY users (if range is large enough)');
    console.log('- Mutual: 0 (all matches deleted)');
    console.log('- Incoming: 0');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetMatchesAndFixLocations();
