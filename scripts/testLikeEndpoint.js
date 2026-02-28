const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Match = require('../models/Match');

// Simulate the likeUser controller logic
async function testLikeEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get two test users
    const users = await User.find().limit(2);
    const currentUser = users[0];
    const likedUser = users[1];

    console.log('\n=== Simulating likeUser API Call ===');
    console.log(`Current User: ${currentUser.name} (${currentUser._id})`);
    console.log(`Liked User: ${likedUser.name} (${likedUser._id})`);

    // Ensure consistent ordering (smaller ID first)
    const [user1, user2] = [currentUser._id.toString(), likedUser._id.toString()].sort();
    const isUser1 = currentUser._id.toString() === user1;

    console.log(`\nSorted order: user1=${user1}, user2=${user2}`);
    console.log(`Current user is user${isUser1 ? '1' : '2'}`);

    // Find or create match record
    let match = await Match.findOne({ user1, user2 });

    if (!match) {
      console.log('\n❌ No existing match found - creating new one');
      match = new Match({
        user1,
        user2,
        user1Liked: isUser1,
        user2Liked: !isUser1
      });
    } else {
      console.log('\n✓ Found existing match');
      console.log(`  user1Liked: ${match.user1Liked}`);
      console.log(`  user2Liked: ${match.user2Liked}`);
      
      // Update the like status
      if (isUser1) {
        match.user1Liked = true;
      } else {
        match.user2Liked = true;
      }
      console.log('\n✓ Updated like status');
      console.log(`  user1Liked: ${match.user1Liked}`);
      console.log(`  user2Liked: ${match.user2Liked}`);
    }

    // Check if it's a match
    const isMatch = match.checkMatch();
    await match.save();

    console.log(`\n${isMatch ? '🎉' : '❌'} Match Status: ${isMatch ? 'MATCHED' : 'NOT MATCHED'}`);

    // Build response like the controller does
    const response = {
      liked: true,
      matched: isMatch,
      match: isMatch ? match : null
    };

    if (isMatch) {
      response.matchedUser = {
        id: likedUser._id.toString(),
        name: likedUser.name,
        username: likedUser.username,
        profilePicture: likedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(likedUser.name)}&background=random`,
        bio: likedUser.bio || ''
      };
    }

    console.log('\n=== API Response ===');
    console.log(JSON.stringify(response, null, 2));

    if (isMatch) {
      console.log('\n✅ SUCCESS! The frontend should receive:');
      console.log('  - result.matched = true');
      console.log('  - result.matchedUser = { id, name, username, profilePicture, bio }');
      console.log('\nThis will trigger the MatchSuccess modal! 🎉');
    } else {
      console.log('\n⚠️  No match yet. The other user needs to like back.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testLikeEndpoint();
