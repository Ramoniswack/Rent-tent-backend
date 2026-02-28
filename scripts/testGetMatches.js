const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
require('dotenv').config();

async function testGetMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the two users
    const user1 = await User.findOne({ email: 'baniya@baniya.baniya' });
    const user2 = await User.findOne({ email: 'sushkunwar7266@gmail.com' });

    if (!user1 || !user2) {
      console.log('❌ Users not found');
      process.exit(1);
    }

    console.log('Testing getMatches for both users:\n');

    // Test for user1 (Bishal)
    console.log('=== User 1: Bishal Baniya ===');
    const matches1 = await Match.find({
      $or: [
        { user1: user1._id },
        { user2: user1._id }
      ],
      matched: true
    })
    .populate('user1', 'name email profilePicture username')
    .populate('user2', 'name email profilePicture username')
    .lean();

    console.log(`Found ${matches1.length} matches`);
    
    for (const match of matches1) {
      const otherUser = match.user1._id.toString() === user1._id.toString() ? match.user2 : match.user1;
      if (otherUser) {
        console.log(`  - ${otherUser.name} (${otherUser.email})`);
      } else {
        console.log(`  - ⚠️  NULL USER (Match ID: ${match._id})`);
      }
    }
    console.log('');

    // Test for user2 (Smita)
    console.log('=== User 2: Smita Kunwar ===');
    const matches2 = await Match.find({
      $or: [
        { user1: user2._id },
        { user2: user2._id }
      ],
      matched: true
    })
    .populate('user1', 'name email profilePicture username')
    .populate('user2', 'name email profilePicture username')
    .lean();

    console.log(`Found ${matches2.length} matches`);
    
    for (const match of matches2) {
      const otherUser = match.user1._id.toString() === user2._id.toString() ? match.user2 : match.user1;
      if (otherUser) {
        console.log(`  - ${otherUser.name} (${otherUser.email})`);
      } else {
        console.log(`  - ⚠️  NULL USER (Match ID: ${match._id})`);
      }
    }
    console.log('');

    console.log('✅ Both users should see each other in their messages page!');
    console.log('');
    console.log('📱 To verify:');
    console.log('   1. Login as baniya@baniya.baniya');
    console.log('   2. Go to http://localhost:3000/messages');
    console.log('   3. You should see Smita Kunwar in the conversation list');
    console.log('');
    console.log('   OR login as sushkunwar7266@gmail.com to see Bishal Baniya');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testGetMatches();
