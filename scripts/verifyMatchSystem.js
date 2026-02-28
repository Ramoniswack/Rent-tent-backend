const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyMatchSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Match System Verification\n');
    console.log('='.repeat(70));

    // Get test user
    const bishal = await User.findOne({ email: 'baniya@baniya.baniya' });
    if (!bishal) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`\n👤 User: ${bishal.name}`);
    console.log(`   ID: ${bishal._id}`);
    console.log(`   Location: ${bishal.location || 'Not set'}`);
    console.log(`   Coordinates: ${bishal.geoLocation?.coordinates || 'Not set'}`);

    // Get all matches involving this user
    const allMatches = await Match.find({
      $or: [
        { user1: bishal._id },
        { user2: bishal._id }
      ]
    }).populate('user1 user2', 'name email');

    console.log(`\n📊 Total Match Records: ${allMatches.length}`);
    console.log('='.repeat(70));

    // Categorize matches
    const mutual = [];
    const incoming = [];
    const outgoing = [];
    const passed = [];

    allMatches.forEach(match => {
      // Skip if either user is null (deleted user)
      if (!match.user1 || !match.user2) {
        console.log('   ⚠️  Skipping match with deleted user');
        return;
      }

      const isUser1 = match.user1._id.toString() === bishal._id.toString();
      const otherUser = isUser1 ? match.user2 : match.user1;
      const myStatus = isUser1 ? match.user1Status : match.user2Status;
      const theirStatus = isUser1 ? match.user2Status : match.user1Status;

      const matchInfo = {
        name: otherUser.name,
        myStatus,
        theirStatus,
        matched: match.matched,
        matchedAt: match.matchedAt
      };

      if (match.matched) {
        mutual.push(matchInfo);
      } else if (myStatus === 'like' && theirStatus === 'none') {
        outgoing.push(matchInfo);
      } else if (myStatus === 'none' && theirStatus === 'like') {
        incoming.push(matchInfo);
      } else if (myStatus === 'pass' || theirStatus === 'pass') {
        passed.push(matchInfo);
      }
    });

    // Display results
    console.log('\n💚 MUTUAL MATCHES (Both liked each other)');
    console.log('-'.repeat(70));
    if (mutual.length === 0) {
      console.log('   None');
    } else {
      mutual.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name}`);
        console.log(`      Matched: ${m.matchedAt ? new Date(m.matchedAt).toLocaleString() : 'N/A'}`);
      });
    }

    console.log('\n📥 INCOMING LIKES (They liked you, you haven\'t responded)');
    console.log('-'.repeat(70));
    if (incoming.length === 0) {
      console.log('   None');
    } else {
      incoming.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name}`);
        console.log(`      Their status: ${m.theirStatus}`);
        console.log(`      Your status: ${m.myStatus}`);
      });
    }

    console.log('\n📤 OUTGOING LIKES (You liked them, they haven\'t responded)');
    console.log('-'.repeat(70));
    if (outgoing.length === 0) {
      console.log('   None');
    } else {
      outgoing.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name}`);
        console.log(`      Your status: ${m.myStatus}`);
        console.log(`      Their status: ${m.theirStatus}`);
      });
    }

    console.log('\n❌ PASSED (You or they passed)');
    console.log('-'.repeat(70));
    if (passed.length === 0) {
      console.log('   None');
    } else {
      passed.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name}`);
        console.log(`      Your status: ${m.myStatus}, Their status: ${m.theirStatus}`);
      });
    }

    // Expected behavior in UI
    console.log('\n🎯 EXPECTED UI BEHAVIOR');
    console.log('='.repeat(70));
    console.log(`\n📱 Discover Tab:`);
    console.log(`   Should show: All users EXCEPT those in the lists above`);
    console.log(`   (Users you haven't liked/passed yet)`);
    
    console.log(`\n💚 Mutual Tab:`);
    console.log(`   Should show: ${mutual.length} user(s)`);
    mutual.forEach((m, i) => console.log(`   ${i + 1}. ${m.name}`));
    
    console.log(`\n📥 Incoming Tab:`);
    console.log(`   Should show: ${incoming.length} user(s)`);
    incoming.forEach((m, i) => console.log(`   ${i + 1}. ${m.name}`));

    console.log('\n' + '='.repeat(70));
    console.log('✅ Verification Complete!');
    console.log('\n💡 To test in browser:');
    console.log('   1. Visit: http://localhost:3000/match/discover');
    console.log('   2. Log in as: baniya@baniya.baniya');
    console.log('   3. Check all three tabs match the expected behavior above');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyMatchSystem();
