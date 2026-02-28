const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

async function testDiscoverAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get a test user
    const currentUser = await User.findOne({ email: 'baniya@baniya.baniya' });
    
    if (!currentUser) {
      console.log('Test user not found');
      return;
    }

    console.log('Testing discover logic for:', currentUser.name);
    console.log('User location:', currentUser.geoLocation?.coordinates);
    console.log('Match preferences:', currentUser.matchPreferences);

    // Check if user has geolocation set
    if (!currentUser.geoLocation || !currentUser.geoLocation.coordinates || 
        currentUser.geoLocation.coordinates.length !== 2) {
      console.log('\n❌ User does not have geolocation set!');
      return;
    }

    const [longitude, latitude] = currentUser.geoLocation.coordinates;
    const maxDistance = (currentUser.matchPreferences?.locationRange || 50) * 1000;

    console.log(`\nSearching within ${maxDistance/1000}km of [${longitude}, ${latitude}]`);

    // Get existing matches to exclude
    const existingMatches = await Match.find({
      $or: [
        { user1: currentUser._id, user1Status: { $in: ['like', 'pass'] } },
        { user2: currentUser._id, user2Status: { $in: ['like', 'pass'] } }
      ]
    }).lean();

    const excludedUserIds = existingMatches.map(match => {
      if (match.user1.toString() === currentUser._id.toString()) {
        return match.user2.toString();
      }
      return match.user1.toString();
    });
    excludedUserIds.push(currentUser._id.toString());

    console.log(`Excluding ${excludedUserIds.length} users (including self)`);

    // Try the aggregation pipeline
    const discoveryPipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: maxDistance,
          spherical: true,
          key: 'geoLocation',
          query: {
            _id: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
            'preferences.publicProfile': true
          }
        }
      },
      {
        $limit: 20
      },
      {
        $project: {
          name: 1,
          username: 1,
          profilePicture: 1,
          location: 1,
          distance: 1,
          travelStyle: 1,
          interests: 1
        }
      }
    ];

    console.log('\nRunning discovery pipeline...');
    const potentialMatches = await User.aggregate(discoveryPipeline);

    console.log(`\n✅ Found ${potentialMatches.length} potential matches:`);
    potentialMatches.forEach((match, i) => {
      console.log(`${i + 1}. ${match.name} - ${Math.round(match.distance/1000)}km away`);
    });

    if (potentialMatches.length === 0) {
      console.log('\n⚠️  No matches found. This could be because:');
      console.log('1. All nearby users have been liked/passed already');
      console.log('2. No users within the location range');
      console.log('3. Other users don\'t have publicProfile enabled');
      
      // Check users without public profile
      const usersWithoutPublicProfile = await User.countDocuments({
        'preferences.publicProfile': { $ne: true }
      });
      console.log(`\nUsers without public profile: ${usersWithoutPublicProfile}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testDiscoverAPI();
