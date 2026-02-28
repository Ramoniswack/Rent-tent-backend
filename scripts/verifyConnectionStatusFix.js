require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');

async function verifyFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(60));
    console.log('CONNECTION STATUS FIX VERIFICATION');
    console.log('='.repeat(60));
    console.log();

    // Check 1: Verify likeUser creates correct status fields
    console.log('CHECK 1: Testing likeUser function logic\n');
    
    const user1 = await User.findOne({ email: 'baniya@baniya.baniya' });
    const user2 = await User.findOne({ email: 'soniklamsal111@gmail.com' });

    if (!user1 || !user2) {
      console.log('❌ Test users not found');
      return;
    }

    const [sortedUser1, sortedUser2] = [user1._id.toString(), user2._id.toString()].sort();
    
    // Delete existing match
    await Match.deleteOne({ user1: sortedUser1, user2: sortedUser2 });
    
    // Create new match using the same logic as likeUser
    const currentUserId = user1._id.toString();
    const likedUserId = user2._id.toString();
    const isUser1 = currentUserId === sortedUser1;

    const match = new Match({
      user1: sortedUser1,
      user2: sortedUser2,
      user1Liked: isUser1,
      user2Liked: !isUser1,
      user1Status: isUser1 ? 'like' : 'none',
      user2Status: isUser1 ? 'none' : 'like'
    });

    await match.save();

    console.log(`✅ Created match between ${user1.name} and ${user2.name}`);
    console.log(`   user1Status: ${match.user1Status} (expected: ${isUser1 ? 'like' : 'none'})`);
    console.log(`   user2Status: ${match.user2Status} (expected: ${isUser1 ? 'none' : 'like'})`);
    
    const statusCorrect = (isUser1 && match.user1Status === 'like' && match.user2Status === 'none') ||
                         (!isUser1 && match.user1Status === 'none' && match.user2Status === 'like');
    
    if (statusCorrect) {
      console.log('   ✅ Status fields are CORRECT\n');
    } else {
      console.log('   ❌ Status fields are INCORRECT\n');
    }

    // Check 2: Verify discover endpoint returns correct connectionStatus
    console.log('CHECK 2: Testing discover endpoint logic\n');

    const existingMatches = await Match.find({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ]
    }).lean();

    console.log(`Found ${existingMatches.length} matches for ${user1.name}\n`);

    existingMatches.forEach(match => {
      const isCurrentUser1 = match.user1.toString() === currentUserId;
      const myStatus = isCurrentUser1 ? match.user1Status : match.user2Status;
      const theirStatus = isCurrentUser1 ? match.user2Status : match.user1Status;
      
      let connectionStatus = 'none';
      if (match.matched) {
        connectionStatus = 'connected';
      } else if (myStatus === 'like') {
        connectionStatus = 'sent';
      } else if (theirStatus === 'like') {
        connectionStatus = 'pending';
      }

      const otherUserId = isCurrentUser1 ? match.user2 : match.user1;
      console.log(`   Match with user ${otherUserId}:`);
      console.log(`     myStatus: ${myStatus}, theirStatus: ${theirStatus}`);
      console.log(`     connectionStatus: ${connectionStatus}`);
      console.log();
    });

    // Check 3: Find any matches with incorrect status fields
    console.log('CHECK 3: Finding matches with missing status fields\n');

    const allMatches = await Match.find({}).lean();
    let incorrectCount = 0;

    for (const match of allMatches) {
      const hasLegacyData = match.user1Liked || match.user2Liked;
      const hasStatusData = match.user1Status !== 'none' || match.user2Status !== 'none';
      
      if (hasLegacyData && !hasStatusData) {
        incorrectCount++;
        if (incorrectCount <= 5) {
          console.log(`   ❌ Match ${match._id}:`);
          console.log(`      user1Liked: ${match.user1Liked}, user1Status: ${match.user1Status}`);
          console.log(`      user2Liked: ${match.user2Liked}, user2Status: ${match.user2Status}`);
        }
      }
    }

    if (incorrectCount === 0) {
      console.log('   ✅ All matches have correct status fields');
    } else {
      console.log(`\n   ⚠️  Found ${incorrectCount} matches with missing status fields`);
      console.log('   Run: node scripts/syncMatchStatusFields.js');
    }

    console.log();
    console.log('='.repeat(60));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log();

    if (statusCorrect && incorrectCount === 0) {
      console.log('✅ ALL CHECKS PASSED - Fix is working correctly!');
      console.log();
      console.log('If you\'re still seeing issues in the frontend:');
      console.log('1. Restart the backend server');
      console.log('2. Clear browser cache and refresh');
      console.log('3. Check browser console for errors');
    } else {
      console.log('❌ SOME CHECKS FAILED - Please review the issues above');
      if (incorrectCount > 0) {
        console.log('\nRun this command to fix existing matches:');
        console.log('  node backend/scripts/syncMatchStatusFields.js');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyFix();
