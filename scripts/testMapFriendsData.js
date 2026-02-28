const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

async function testMapFriendsData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Bishal's user
    const bishal = await User.findOne({ email: 'baniya@baniya.baniya' });
    if (!bishal) {
      console.log('Bishal not found');
      return;
    }

    console.log('\n=== BISHAL USER DATA ===');
    console.log('ID:', bishal._id);
    console.log('Name:', bishal.name);
    console.log('Coordinates:', bishal.coordinates);
    console.log('Location:', bishal.location);

    // Get all matches for Bishal
    const matches = await Match.find({
      $or: [
        { user1: bishal._id },
        { user2: bishal._id }
      ],
      matched: true
    })
    .populate('user1', '-password')
    .populate('user2', '-password')
    .sort({ matchedAt: -1 });

    console.log('\n=== MATCHED USERS ===');
    console.log('Total matches:', matches.length);

    matches.forEach((match, index) => {
      const otherUser = match.user1._id.toString() === bishal._id.toString() 
        ? match.user2 
        : match.user1;
      
      console.log(`\nMatch ${index + 1}:`);
      console.log('  User ID:', otherUser._id);
      console.log('  Name:', otherUser.name);
      console.log('  Username:', otherUser.username);
      console.log('  Coordinates:', otherUser.coordinates);
      console.log('  Location:', otherUser.location);
      console.log('  Profile Picture:', otherUser.profilePicture ? 'Yes' : 'No');
      console.log('  Matched At:', match.matchedAt);
    });

    // Test the formatted response (like the API would return)
    console.log('\n=== FORMATTED API RESPONSE ===');
    const formattedMatches = matches.map(match => {
      const otherUser = match.user1._id.toString() === bishal._id.toString() 
        ? match.user2 
        : match.user1;
      
      return {
        matchId: match._id,
        user: {
          _id: otherUser._id,
          name: otherUser.name,
          username: otherUser.username,
          profilePicture: otherUser.profilePicture,
          bio: otherUser.bio,
          age: otherUser.age,
          gender: otherUser.gender,
          location: otherUser.location,
          coordinates: otherUser.coordinates,
          interests: otherUser.interests,
          travelStyle: otherUser.travelStyle,
          languages: otherUser.languages
        },
        matchedAt: match.matchedAt
      };
    });

    console.log(JSON.stringify(formattedMatches, null, 2));

    // Check discover endpoint data
    console.log('\n=== DISCOVER ENDPOINT DATA ===');
    const allUsers = await User.find({
      _id: { $ne: bishal._id },
      'preferences.publicProfile': { $ne: false }
    })
    .select('name username profilePicture bio age gender location interests travelStyle languages coordinates')
    .limit(5)
    .lean();

    console.log('Sample users from discover:');
    allUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('  ID:', user._id);
      console.log('  Name:', user.name);
      console.log('  Username:', user.username);
      console.log('  Coordinates:', user.coordinates);
      console.log('  Location:', user.location);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testMapFriendsData();
