const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createTestMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get test users
    const bishal = await User.findOne({ email: 'baniya@baniya.baniya' });
    const ramon = await User.findOne({ name: 'Ramon Tiwari' });
    const ashis = await User.findOne({ name: 'ASHIS ACHARYA' });
    
    if (!bishal || !ramon || !ashis) {
      console.log('Test users not found');
      console.log('Bishal:', !!bishal);
      console.log('Ramon:', !!ramon);
      console.log('Ashis:', !!ashis);
      return;
    }

    console.log('Creating test match scenarios...\n');

    // Scenario 1: Create a mutual match (Bishal <-> Ramon)
    console.log('1. Creating mutual match: Bishal <-> Ramon');
    const [user1_1, user2_1] = [bishal._id.toString(), ramon._id.toString()].sort();
    await Match.findOneAndUpdate(
      { user1: user1_1, user2: user2_1 },
      {
        user1: user1_1,
        user2: user2_1,
        user1Status: 'like',
        user2Status: 'like',
        user1Liked: true,
        user2Liked: true,
        matched: true,
        matchedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log('   ✅ Mutual match created');

    // Scenario 2: Create an incoming like (Ashis likes Bishal, but Bishal hasn't responded)
    console.log('\n2. Creating incoming like: Ashis -> Bishal (pending)');
    const [user1_2, user2_2] = [bishal._id.toString(), ashis._id.toString()].sort();
    const isUser1Ashis = user1_2 === ashis._id.toString();
    
    await Match.findOneAndUpdate(
      { user1: user1_2, user2: user2_2 },
      {
        user1: user1_2,
        user2: user2_2,
        user1Status: isUser1Ashis ? 'like' : 'none',
        user2Status: isUser1Ashis ? 'none' : 'like',
        user1Liked: isUser1Ashis,
        user2Liked: !isUser1Ashis,
        matched: false
      },
      { upsert: true, new: true }
    );
    console.log('   ✅ Incoming like created');

    console.log('\n' + '='.repeat(60));
    console.log('Test data created successfully!');
    console.log('\nExpected results for Bishal:');
    console.log('- Discover tab: Should show other users (excluding Ramon and Ashis)');
    console.log('- Mutual tab: Should show 1 match (Ramon)');
    console.log('- Incoming tab: Should show 1 like (Ashis)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestMatches();
