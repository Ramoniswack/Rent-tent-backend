const mongoose = require('mongoose');
require('dotenv').config();

const Match = require('../models/Match');
const User = require('../models/User');

async function debugLikesData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all matches
    const allMatches = await Match.find({})
      .populate('user1', 'name username')
      .populate('user2', 'name username')
      .lean();

    console.log(`📊 Total matches in database: ${allMatches.length}\n`);

    if (allMatches.length === 0) {
      console.log('⚠️  No matches found in database');
      console.log('   Create some test matches first!\n');
      process.exit(0);
    }

    // Analyze match data structure
    console.log('🔍 Analyzing match data structure:\n');
    
    const sampleMatch = allMatches[0];
    console.log('Sample match fields:');
    console.log('  - user1Status:', sampleMatch.user1Status);
    console.log('  - user2Status:', sampleMatch.user2Status);
    console.log('  - user1Liked:', sampleMatch.user1Liked);
    console.log('  - user2Liked:', sampleMatch.user2Liked);
    console.log('  - matched:', sampleMatch.matched);
    console.log('  - matchedAt:', sampleMatch.matchedAt);
    console.log('');

    // Count matches by status
    const statusCounts = {
      bothLiked: 0,
      user1LikedOnly: 0,
      user2LikedOnly: 0,
      neitherLiked: 0,
      matched: 0
    };

    allMatches.forEach(match => {
      if (match.matched) {
        statusCounts.matched++;
      }
      
      const user1HasLiked = match.user1Status === 'like' || match.user1Liked === true;
      const user2HasLiked = match.user2Status === 'like' || match.user2Liked === true;

      if (user1HasLiked && user2HasLiked) {
        statusCounts.bothLiked++;
      } else if (user1HasLiked) {
        statusCounts.user1LikedOnly++;
      } else if (user2HasLiked) {
        statusCounts.user2LikedOnly++;
      } else {
        statusCounts.neitherLiked++;
      }
    });

    console.log('📈 Match statistics:');
    console.log('  - Matched:', statusCounts.matched);
    console.log('  - Both liked (pending):', statusCounts.bothLiked);
    console.log('  - User1 liked only:', statusCounts.user1LikedOnly);
    console.log('  - User2 liked only:', statusCounts.user2LikedOnly);
    console.log('  - Neither liked:', statusCounts.neitherLiked);
    console.log('');

    // Show pending likes (not matched)
    console.log('💚 Pending likes (not matched yet):\n');
    
    const pendingLikes = allMatches.filter(match => !match.matched);
    
    if (pendingLikes.length === 0) {
      console.log('  No pending likes found\n');
    } else {
      pendingLikes.forEach((match, idx) => {
        const user1HasLiked = match.user1Status === 'like' || match.user1Liked === true;
        const user2HasLiked = match.user2Status === 'like' || match.user2Liked === true;
        
        console.log(`  ${idx + 1}. ${match.user1.name} ↔ ${match.user2.name}`);
        console.log(`     User1 liked: ${user1HasLiked} (status: ${match.user1Status}, liked: ${match.user1Liked})`);
        console.log(`     User2 liked: ${user2HasLiked} (status: ${match.user2Status}, liked: ${match.user2Liked})`);
        console.log('');
      });
    }

    // Test the query logic
    console.log('🧪 Testing query logic:\n');
    
    // Pick a user to test with
    const testUser = await User.findOne({});
    if (!testUser) {
      console.log('⚠️  No users found in database');
      process.exit(0);
    }

    console.log(`Testing with user: ${testUser.name} (${testUser._id})\n`);

    // Test "Liked You" query
    const likedYouMatches = await Match.find({
      $or: [
        { user1: testUser._id, user2Status: 'like', user1Status: { $ne: 'like' } },
        { user2: testUser._id, user1Status: 'like', user2Status: { $ne: 'like' } }
      ]
    })
    .populate('user1', 'name username')
    .populate('user2', 'name username');

    console.log(`📥 "Liked You" results: ${likedYouMatches.length} matches`);
    likedYouMatches.forEach((match, idx) => {
      const otherUser = match.user1._id.toString() === testUser._id.toString() 
        ? match.user2 
        : match.user1;
      console.log(`  ${idx + 1}. ${otherUser.name} liked you`);
    });
    console.log('');

    // Test "Sent Likes" query
    const sentLikesMatches = await Match.find({
      $or: [
        { user1: testUser._id, user1Status: 'like', user2Status: { $ne: 'like' } },
        { user2: testUser._id, user2Status: 'like', user1Status: { $ne: 'like' } }
      ]
    })
    .populate('user1', 'name username')
    .populate('user2', 'name username');

    console.log(`📤 "Sent Likes" results: ${sentLikesMatches.length} matches`);
    sentLikesMatches.forEach((match, idx) => {
      const otherUser = match.user1._id.toString() === testUser._id.toString() 
        ? match.user2 
        : match.user1;
      console.log(`  ${idx + 1}. You liked ${otherUser.name}`);
    });
    console.log('');

    // Check if we need to migrate data
    const needsMigration = allMatches.some(match => {
      return (match.user1Liked === true || match.user2Liked === true) && 
             (!match.user1Status || !match.user2Status || 
              match.user1Status === 'none' || match.user2Status === 'none');
    });

    if (needsMigration) {
      console.log('⚠️  MIGRATION NEEDED!');
      console.log('   Some matches use legacy fields (user1Liked/user2Liked)');
      console.log('   but don\'t have proper status fields set.');
      console.log('   Run: node scripts/migrateLegacyMatches.js\n');
    } else {
      console.log('✅ All matches are using the new status fields correctly\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugLikesData();
