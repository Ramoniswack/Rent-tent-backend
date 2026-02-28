require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');

async function testConnectionStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a test user (you can replace with actual user ID)
    const testUser = await User.findOne({ email: 'baniya@baniya.baniya' });
    if (!testUser) {
      console.log('Test user not found');
      return;
    }

    const userId = testUser._id.toString();
    console.log(`\nTesting for user: ${testUser.name} (${userId})`);

    // Get all matches for this user
    const matches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    }).populate('user1 user2', 'name email');

    console.log(`\nFound ${matches.length} match records:`);

    matches.forEach(match => {
      const isUser1 = match.user1._id.toString() === userId;
      const otherUser = isUser1 ? match.user2 : match.user1;
      const myStatus = isUser1 ? match.user1Status : match.user2Status;
      const theirStatus = isUser1 ? match.user2Status : match.user1Status;

      let connectionStatus = 'none';
      if (match.matched) {
        connectionStatus = 'connected';
      } else if (myStatus === 'like') {
        connectionStatus = 'sent';
      } else if (theirStatus === 'like') {
        connectionStatus = 'pending';
      }

      console.log(`\n  Other User: ${otherUser.name}`);
      console.log(`  My Status: ${myStatus}`);
      console.log(`  Their Status: ${theirStatus}`);
      console.log(`  Matched: ${match.matched}`);
      console.log(`  Connection Status: ${connectionStatus}`);
    });

    // Now test the discover endpoint logic
    console.log('\n\n=== TESTING DISCOVER ENDPOINT LOGIC ===\n');

    const existingMatches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    }).lean();

    const userInteractions = {};
    existingMatches.forEach(match => {
      const isUser1 = match.user1.toString() === userId;
      const otherUserId = isUser1 ? match.user2.toString() : match.user1.toString();
      const myStatus = isUser1 ? match.user1Status : match.user2Status;
      const theirStatus = isUser1 ? match.user2Status : match.user1Status;
      
      userInteractions[otherUserId] = {
        myStatus,
        theirStatus,
        matched: match.matched
      };
    });

    console.log('User Interactions Map:');
    for (const [otherUserId, interaction] of Object.entries(userInteractions)) {
      const otherUser = await User.findById(otherUserId).select('name');
      
      let connectionStatus = 'none';
      if (interaction.matched) {
        connectionStatus = 'connected';
      } else if (interaction.myStatus === 'like') {
        connectionStatus = 'sent';
      } else if (interaction.theirStatus === 'like') {
        connectionStatus = 'pending';
      }

      console.log(`\n  ${otherUser.name}:`);
      console.log(`    My Status: ${interaction.myStatus}`);
      console.log(`    Their Status: ${interaction.theirStatus}`);
      console.log(`    Matched: ${interaction.matched}`);
      console.log(`    Connection Status: ${connectionStatus}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testConnectionStatus();
