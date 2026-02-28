require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');

async function testMessaging() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get recent messages
    console.log('📨 RECENT MESSAGES (Last 10):');
    console.log('='.repeat(80));
    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .lean();

    if (recentMessages.length === 0) {
      console.log('❌ No messages found in database');
    } else {
      recentMessages.forEach((msg, index) => {
        console.log(`\n${index + 1}. Message ID: ${msg._id}`);
        console.log(`   From: ${msg.sender?.name || 'Unknown'} (${msg.sender?._id})`);
        console.log(`   To: ${msg.receiver?.name || 'Unknown'} (${msg.receiver?._id})`);
        console.log(`   Text: ${msg.text || '(image)'}`);
        console.log(`   ClientSideId: ${msg.clientSideId || '❌ MISSING'}`);
        console.log(`   Read: ${msg.read ? '✅' : '❌'}`);
        console.log(`   Created: ${msg.createdAt}`);
      });
    }

    // Check for messages without clientSideId
    console.log('\n\n🔍 CHECKING FOR MESSAGES WITHOUT clientSideId:');
    console.log('='.repeat(80));
    const messagesWithoutClientSideId = await Message.countDocuments({
      clientSideId: { $exists: false }
    });
    
    if (messagesWithoutClientSideId > 0) {
      console.log(`⚠️  Found ${messagesWithoutClientSideId} messages without clientSideId`);
      console.log('   These are old messages from before the fix');
    } else {
      console.log('✅ All messages have clientSideId field');
    }

    // Get all users
    console.log('\n\n👥 USERS IN DATABASE:');
    console.log('='.repeat(80));
    const users = await User.find().select('name email _id').lean();
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
    });

    // Get all matches
    console.log('\n\n💑 MATCHES IN DATABASE:');
    console.log('='.repeat(80));
    const matches = await Match.find({ matched: true })
      .populate('user1', 'name')
      .populate('user2', 'name')
      .lean();

    if (matches.length === 0) {
      console.log('❌ No matches found');
      console.log('   Users need to match on /match page before they can message');
    } else {
      matches.forEach((match, index) => {
        console.log(`\n${index + 1}. ${match.user1?.name} ↔️ ${match.user2?.name}`);
        console.log(`   Match ID: ${match._id}`);
        console.log(`   Matched: ${match.matched ? '✅' : '❌'}`);
        console.log(`   Matched At: ${match.matchedAt || 'N/A'}`);
      });
    }

    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Matches: ${matches.length}`);
    console.log(`Total Messages: ${recentMessages.length}`);
    console.log(`Messages without clientSideId: ${messagesWithoutClientSideId}`);

    console.log('\n\n🧪 TESTING RECOMMENDATIONS:');
    console.log('='.repeat(80));
    if (matches.length === 0) {
      console.log('⚠️  No matches found - users cannot message each other yet');
      console.log('   1. Go to http://localhost:3000/match');
      console.log('   2. Swipe right on users to match');
      console.log('   3. Or use backend/scripts/createMatch.js to create test match');
    } else {
      console.log('✅ Matches exist - users can message each other');
      console.log('   1. Login as one of the matched users');
      console.log('   2. Go to http://localhost:3000/messages');
      console.log('   3. Send a message');
      console.log('   4. Check if message appears and persists after refresh');
    }

    console.log('\n\n⚠️  IMPORTANT REMINDER:');
    console.log('='.repeat(80));
    console.log('Permission checks are TEMPORARILY DISABLED for testing');
    console.log('After confirming messages work, you MUST re-enable them in:');
    console.log('  1. backend/server.js (Socket.IO handler)');
    console.log('  2. backend/controllers/messageController.js (HTTP handler)');
    console.log('\nSee .kiro/specs/doc/MESSAGING_FIX_FINAL.md for instructions');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testMessaging();
