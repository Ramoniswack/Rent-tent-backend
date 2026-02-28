const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
require('dotenv').config();

async function checkMatchStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the two users
    const user1 = await User.findOne({ email: 'baniya@baniya.baniya' });
    const user2 = await User.findOne({ email: 'sushkunwar7266@gmail.com' });

    if (!user1) {
      console.log('❌ User baniya@baniya.baniya not found');
      process.exit(1);
    }

    if (!user2) {
      console.log('❌ User sushkunwar7266@gmail.com not found');
      process.exit(1);
    }

    console.log('✅ Found users:');
    console.log(`   User 1: ${user1.name} (${user1._id})`);
    console.log(`   User 2: ${user2.name} (${user2._id})`);
    console.log('');

    // Check for match record
    const match = await Match.findOne({
      $or: [
        { user1: user1._id, user2: user2._id },
        { user1: user2._id, user2: user1._id }
      ]
    });

    if (match) {
      console.log('✅ Match record found:');
      console.log(`   Match ID: ${match._id}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Matched: ${match.matched}`);
      console.log(`   Created: ${match.createdAt}`);
      console.log('');
    } else {
      console.log('❌ No match record found between these users');
      console.log('   This is why they don\'t appear in each other\'s messages page!');
      console.log('');
    }

    // Check for messages
    const messageCount = await Message.countDocuments({
      $or: [
        { sender: user1._id, receiver: user2._id },
        { sender: user2._id, receiver: user1._id }
      ]
    });

    console.log(`📬 Messages between users: ${messageCount}`);
    console.log('');

    if (messageCount > 0 && !match) {
      console.log('⚠️  ISSUE IDENTIFIED:');
      console.log('   Messages exist but no Match record with matched=true');
      console.log('   The messages page only shows users with matched=true');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   Run: node scripts/createMatchForUsers.js');
      console.log('   This will create a Match record so they appear in messages page');
    } else if (match && !match.matched) {
      console.log('⚠️  ISSUE IDENTIFIED:');
      console.log('   Match exists but matched=false');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   Run: node scripts/updateMatchStatus.js');
      console.log('   This will set matched=true');
    } else if (match && match.matched) {
      console.log('✅ Everything looks good!');
      console.log('   Users should appear in each other\'s messages page');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkMatchStatus();
