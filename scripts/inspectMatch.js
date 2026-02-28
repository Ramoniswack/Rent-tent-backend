const mongoose = require('mongoose');
const Match = require('../models/Match');
require('dotenv').config();

async function inspectMatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const user1Id = '699603de3b896fac9a1516f8'; // mrbishalbaniya
    const user2Id = '6997ea13cabe9baad628cb96'; // sush1

    // Find the match
    const match = await Match.findOne({
      $or: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id }
      ]
    }).lean();

    if (!match) {
      console.log('❌ No match found between these users');
      process.exit(1);
    }

    console.log('=== Match Record ===\n');
    console.log(JSON.stringify(match, null, 2));
    console.log('\n');

    console.log('=== Analysis ===\n');
    console.log(`Match ID: ${match._id}`);
    console.log(`User1: ${match.user1}`);
    console.log(`User2: ${match.user2}`);
    console.log(`Matched: ${match.matched}`);
    console.log(`MatchedAt: ${match.matchedAt}`);
    console.log('');
    console.log('User1 Settings:');
    console.log(`  isPinned: ${match.user1Settings?.isPinned}`);
    console.log(`  nickname: ${match.user1Settings?.nickname || '(none)'}`);
    console.log(`  isBlocked: ${match.user1Settings?.isBlocked}`);
    console.log(`  isMuted: ${match.user1Settings?.isMuted}`);
    console.log('');
    console.log('User2 Settings:');
    console.log(`  isPinned: ${match.user2Settings?.isPinned}`);
    console.log(`  nickname: ${match.user2Settings?.nickname || '(none)'}`);
    console.log(`  isBlocked: ${match.user2Settings?.isBlocked}`);
    console.log(`  isMuted: ${match.user2Settings?.isMuted}`);
    console.log('');

    // Check if settings exist
    if (!match.user1Settings) {
      console.log('⚠️  user1Settings is missing!');
    }
    if (!match.user2Settings) {
      console.log('⚠️  user2Settings is missing!');
    }

    // Check if isBlocked is true
    if (match.user1Settings?.isBlocked) {
      console.log('⚠️  User1 has blocked User2!');
    }
    if (match.user2Settings?.isBlocked) {
      console.log('⚠️  User2 has blocked User1!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

inspectMatch();
