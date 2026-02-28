require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');

async function debugMatchIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const allUsers = await User.find({})
      .select('name username profilePicture age gender location interests travelStyle coordinates geoLocation')
      .lean();
    
    console.log('\n=== USER DATA ANALYSIS ===');
    console.log(`Total users in database: ${allUsers.length}`);
    
    // Analyze user data completeness
    const usersWithProfilePicture = allUsers.filter(u => u.profilePicture).length;
    const usersWithName = allUsers.filter(u => u.name).length;
    const usersWithUsername = allUsers.filter(u => u.username).length;
    const usersWithAge = allUsers.filter(u => u.age).length;
    const usersWithGender = allUsers.filter(u => u.gender).length;
    const usersWithLocation = allUsers.filter(u => u.location).length;
    const usersWithCoordinates = allUsers.filter(u => u.coordinates?.lat && u.coordinates?.lng).length;
    const usersWithGeoLocation = allUsers.filter(u => u.geoLocation?.coordinates?.length === 2).length;
    const usersWithInterests = allUsers.filter(u => u.interests?.length > 0).length;
    const usersWithTravelStyle = allUsers.filter(u => u.travelStyle).length;

    console.log('\nUser Data Completeness:');
    console.log(`- Profile Picture: ${usersWithProfilePicture}/${allUsers.length} (${Math.round(usersWithProfilePicture/allUsers.length*100)}%)`);
    console.log(`- Name: ${usersWithName}/${allUsers.length} (${Math.round(usersWithName/allUsers.length*100)}%)`);
    console.log(`- Username: ${usersWithUsername}/${allUsers.length} (${Math.round(usersWithUsername/allUsers.length*100)}%)`);
    console.log(`- Age: ${usersWithAge}/${allUsers.length} (${Math.round(usersWithAge/allUsers.length*100)}%)`);
    console.log(`- Gender: ${usersWithGender}/${allUsers.length} (${Math.round(usersWithGender/allUsers.length*100)}%)`);
    console.log(`- Location: ${usersWithLocation}/${allUsers.length} (${Math.round(usersWithLocation/allUsers.length*100)}%)`);
    console.log(`- Coordinates: ${usersWithCoordinates}/${allUsers.length} (${Math.round(usersWithCoordinates/allUsers.length*100)}%)`);
    console.log(`- GeoLocation: ${usersWithGeoLocation}/${allUsers.length} (${Math.round(usersWithGeoLocation/allUsers.length*100)}%)`);
    console.log(`- Interests: ${usersWithInterests}/${allUsers.length} (${Math.round(usersWithInterests/allUsers.length*100)}%)`);
    console.log(`- Travel Style: ${usersWithTravelStyle}/${allUsers.length} (${Math.round(usersWithTravelStyle/allUsers.length*100)}%)`);

    // Check users that would be returned by getAllUsers API
    const apiUsers = await User.find({ 
      profilePicture: { $exists: true, $ne: null, $ne: '' },
      name: { $exists: true, $ne: null, $ne: '' }
    })
    .select('-password -email')
    .limit(50)
    .lean();

    console.log(`\nUsers returned by getAllUsers API: ${apiUsers.length}`);

    // Sample user data
    console.log('\n=== SAMPLE USER DATA ===');
    if (apiUsers.length > 0) {
      const sampleUser = apiUsers[0];
      console.log('Sample user:', {
        id: sampleUser._id,
        name: sampleUser.name,
        username: sampleUser.username,
        age: sampleUser.age,
        gender: sampleUser.gender,
        location: sampleUser.location,
        hasProfilePicture: !!sampleUser.profilePicture,
        coordinates: sampleUser.coordinates,
        geoLocation: sampleUser.geoLocation,
        interests: sampleUser.interests,
        travelStyle: sampleUser.travelStyle
      });
    }

    // Check matches data
    const allMatches = await Match.find({}).lean();
    console.log(`\n=== MATCH DATA ANALYSIS ===`);
    console.log(`Total matches in database: ${allMatches.length}`);

    // Check for a specific user (if any exists)
    if (apiUsers.length > 0) {
      const testUserId = apiUsers[0]._id;
      console.log(`\nTesting with user: ${testUserId}`);
      
      // Get matches for this user
      const userMatches = await Match.find({
        $or: [
          { user1: testUserId },
          { user2: testUserId }
        ]
      }).lean();
      
      console.log(`Matches for test user: ${userMatches.length}`);
      
      // Get interacted user IDs
      const interactedUserIds = userMatches.map(match => {
        return match.user1.toString() === testUserId.toString() 
          ? match.user2.toString() 
          : match.user1.toString();
      });
      
      console.log(`Interacted user IDs: ${interactedUserIds.length}`);
      
      // Simulate filtering logic
      const filteredUsers = apiUsers.filter(user => {
        // Exclude current user
        if (user._id.toString() === testUserId.toString()) {
          return false;
        }
        
        // Exclude interacted users
        if (interactedUserIds.includes(user._id.toString())) {
          return false;
        }
        
        return true;
      });
      
      console.log(`Users after filtering: ${filteredUsers.length}`);
      
      if (filteredUsers.length > 0) {
        console.log('Sample filtered user:', {
          id: filteredUsers[0]._id,
          name: filteredUsers[0].name,
          username: filteredUsers[0].username
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugMatchIssue();