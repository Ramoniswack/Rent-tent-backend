const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

async function checkUserMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the two users
    const user1 = await User.findOne({ email: 'mr.bishal.baniya@gmail.com' });
    const user2 = await User.findOne({ email: 'sushmitakunwar7266@gmail.com' });

    if (!user1) {
      console.log('❌ User mr.bishal.baniya@gmail.com not found');
      process.exit(1);
    }

    if (!user2) {
      console.log('❌ User sushmitakunwar7266@gmail.com not found');
      process.exit(1);
    }

    console.log('✅ Found users:');
    console.log(`   User 1: ${user1.name} (${user1._id})`);
    console.log(`   User 2: ${user2.name} (${user2._id})`);
    console.log('');

    // Check for match record
    const [id1, id2] = [user1._id.toString(), user2._id.toString()].sort();
    
    const match = await Match.findOne({
      $or: [
        { user1: id1, user2: id2 },
        { user1: id2, user2: id1 }
      ]
    });

    if (match) {
      console.log('📋 Match Record Found:');
      console.log('   Match ID:', match._id);
      console.log('   User 1:', match.user1);
      console.log('   User 2:', match.user2);
      console.log('   User 1 Status:', match.user1Status || 'none');
      console.log('   User 2 Status:', match.user2Status || 'none');
      console.log('   Matched:', match.matched ? 'Yes' : 'No');
      console.log('   Created:', match.createdAt);
      console.log('');

      // Determine who is who
      const isUser1First = match.user1.toString() === user1._id.toString();
      console.log('📊 Status Breakdown:');
      console.log(`   ${user1.name}: ${isUser1First ? match.user1Status : match.user2Status}`);
      console.log(`   ${user2.name}: ${isUser1First ? match.user2Status : match.user1Status}`);
      console.log('');

      console.log('💡 What this means:');
      if (match.user1Status === 'like' || match.user2Status === 'like' || 
          match.user1Status === 'pass' || match.user2Status === 'pass') {
        console.log('   ⚠️  These users have already interacted (liked or passed)');
        console.log('   ⚠️  They will NOT appear in each other\'s discovery feed');
        console.log('');
        console.log('🔧 To make them appear again:');
        console.log('   Option 1: Delete this match record');
        console.log('   Option 2: Reset their statuses to "none"');
      } else {
        console.log('   ✅ No interaction yet - they should appear in discovery');
      }
    } else {
      console.log('✅ No match record found');
      console.log('   These users have NOT interacted yet');
      console.log('   They SHOULD appear in each other\'s discovery feed');
    }

    console.log('');
    console.log('🔍 User Details:');
    console.log(`\n${user1.name}:`);
    console.log('   Location:', user1.location || 'Not set');
    console.log('   Coordinates:', user1.geoLocation?.coordinates || user1.coordinates || 'Not set');
    console.log('   Age:', user1.age || 'Not set');
    console.log('   Gender:', user1.gender || 'Not set');
    console.log('   Travel Style:', user1.travelStyle || 'Not set');
    console.log('   Interests:', user1.interests?.length ? user1.interests.join(', ') : 'None');
    console.log('   Public Profile:', user1.preferences?.publicProfile ? 'Yes' : 'No');

    console.log(`\n${user2.name}:`);
    console.log('   Location:', user2.location || 'Not set');
    console.log('   Coordinates:', user2.geoLocation?.coordinates || user2.coordinates || 'Not set');
    console.log('   Age:', user2.age || 'Not set');
    console.log('   Gender:', user2.gender || 'Not set');
    console.log('   Travel Style:', user2.travelStyle || 'Not set');
    console.log('   Interests:', user2.interests?.length ? user2.interests.join(', ') : 'None');
    console.log('   Public Profile:', user2.preferences?.publicProfile ? 'Yes' : 'No');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkUserMatches();
