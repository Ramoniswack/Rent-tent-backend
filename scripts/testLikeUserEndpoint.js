require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');

async function testLikeUserEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get two test users
    const user1 = await User.findOne({ email: 'baniya@baniya.baniya' });
    const user2 = await User.findOne({ email: 'dddd@e.dd' });

    if (!user1 || !user2) {
      console.log('❌ Test users not found');
      console.log(`User 1: ${user1 ? 'Found' : 'Not found'}`);
      console.log(`User 2: ${user2 ? 'Found' : 'Not found'}`);
      return;
    }

    console.log(`User 1: ${user1.name} (${user1._id})`);
    console.log(`User 2: ${user2.name} (${user2._id})\n`);

    // Delete existing match if any
    const [userId1, userId2] = [user1._id.toString(), user2._id.toString()].sort();
    await Match.deleteOne({ user1: userId1, user2: userId2 });
    console.log('🗑️  Deleted existing match record\n');

    // Simulate likeUser function
    const likedUserId = user2._id.toString();
    const currentUserId = user1._id.toString();

    // Ensure consistent ordering
    const [sortedUser1, sortedUser2] = [currentUserId, likedUserId].sort();
    const isUser1 = currentUserId === sortedUser1;

    console.log(`Creating new match:`);
    console.log(`  user1: ${sortedUser1} (${isUser1 ? 'current user' : 'liked user'})`);
    console.log(`  user2: ${sortedUser2} (${isUser1 ? 'liked user' : 'current user'})`);
    console.log(`  isUser1: ${isUser1}\n`);

    // Create match
    let match = new Match({
      user1: sortedUser1,
      user2: sortedUser2,
      user1Liked: isUser1,
      user2Liked: !isUser1,
      user1Status: isUser1 ? 'like' : 'none',
      user2Status: isUser1 ? 'none' : 'like'
    });

    await match.save();
    console.log('✅ Match created successfully\n');

    // Verify the match
    const savedMatch = await Match.findOne({ user1: sortedUser1, user2: sortedUser2 });
    console.log('📊 Saved Match Details:');
    console.log(`  user1Liked: ${savedMatch.user1Liked}`);
    console.log(`  user2Liked: ${savedMatch.user2Liked}`);
    console.log(`  user1Status: ${savedMatch.user1Status}`);
    console.log(`  user2Status: ${savedMatch.user2Status}`);
    console.log(`  matched: ${savedMatch.matched}\n`);

    // Test connection status logic
    const myStatus = isUser1 ? savedMatch.user1Status : savedMatch.user2Status;
    const theirStatus = isUser1 ? savedMatch.user2Status : savedMatch.user1Status;
    
    let connectionStatus = 'none';
    if (savedMatch.matched) {
      connectionStatus = 'connected';
    } else if (myStatus === 'like') {
      connectionStatus = 'sent';
    } else if (theirStatus === 'like') {
      connectionStatus = 'pending';
    }

    console.log('🔍 Connection Status Calculation:');
    console.log(`  My Status: ${myStatus}`);
    console.log(`  Their Status: ${theirStatus}`);
    console.log(`  Connection Status: ${connectionStatus}`);
    console.log(`  Expected: sent\n`);

    if (connectionStatus === 'sent') {
      console.log('✅ TEST PASSED: Connection status is correct!');
    } else {
      console.log('❌ TEST FAILED: Connection status should be "sent"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testLikeUserEndpoint();
