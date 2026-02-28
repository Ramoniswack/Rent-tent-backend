const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

async function createBishalSandipMatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Bishal
    const bishal = await User.findOne({ email: 'baniya@baniya.baniya' });
    if (!bishal) {
      console.log('❌ Bishal not found');
      return;
    }

    // Find Sandip
    const sandip = await User.findOne({ email: 'sandip@sandip.sandip' });
    if (!sandip) {
      console.log('❌ Sandip not found');
      return;
    }

    console.log('=== USERS FOUND ===');
    console.log('Bishal:', bishal.name, '(' + bishal.email + ')');
    console.log('  Coordinates:', bishal.coordinates);
    console.log('  Location:', bishal.location);
    console.log('\nSandip:', sandip.name, '(' + sandip.email + ')');
    console.log('  Coordinates:', sandip.coordinates);
    console.log('  Location:', sandip.location);

    // Check if Sandip has coordinates
    if (!sandip.coordinates || !sandip.coordinates.lat || !sandip.coordinates.lng) {
      console.log('\n⚠️  WARNING: Sandip does not have coordinates set!');
      console.log('Setting default coordinates for Sandip (Biratnagar, Nepal)...');
      
      sandip.coordinates = {
        lat: 26.4525,
        lng: 87.2718
      };
      sandip.geoLocation = {
        type: 'Point',
        coordinates: [87.2718, 26.4525]
      };
      await sandip.save();
      console.log('✅ Coordinates set for Sandip');
    }

    // Sort user IDs to maintain consistency
    const [user1, user2] = [bishal._id.toString(), sandip._id.toString()].sort();

    // Check if match already exists
    const existingMatch = await Match.findOne({ 
      user1: new mongoose.Types.ObjectId(user1),
      user2: new mongoose.Types.ObjectId(user2)
    });

    if (existingMatch) {
      console.log('\n⚠️  Match record already exists');
      console.log('Updating to matched status...');
      
      existingMatch.matched = true;
      existingMatch.matchedAt = new Date();
      existingMatch.user1Status = 'like';
      existingMatch.user2Status = 'like';
      existingMatch.user1Liked = true;
      existingMatch.user2Liked = true;
      
      await existingMatch.save();
      console.log('✅ Match updated successfully');
    } else {
      console.log('\n📝 Creating new match record...');
      
      const newMatch = new Match({
        user1: new mongoose.Types.ObjectId(user1),
        user2: new mongoose.Types.ObjectId(user2),
        matched: true,
        matchedAt: new Date(),
        user1Status: 'like',
        user2Status: 'like',
        user1Liked: true,
        user2Liked: true
      });

      await newMatch.save();
      console.log('✅ Match created successfully');
    }

    // Verify the match
    const verifyMatch = await Match.findOne({ 
      user1: new mongoose.Types.ObjectId(user1),
      user2: new mongoose.Types.ObjectId(user2)
    })
    .populate('user1', 'name email coordinates')
    .populate('user2', 'name email coordinates');

    console.log('\n=== MATCH VERIFICATION ===');
    console.log('Match ID:', verifyMatch._id);
    console.log('Matched:', verifyMatch.matched ? 'YES ✅' : 'NO ❌');
    console.log('User 1:', verifyMatch.user1.name, '- Coordinates:', verifyMatch.user1.coordinates);
    console.log('User 2:', verifyMatch.user2.name, '- Coordinates:', verifyMatch.user2.coordinates);
    console.log('Matched At:', verifyMatch.matchedAt);

    console.log('\n✅ SUCCESS! Bishal and Sandip are now matched.');
    console.log('They should now appear on each other\'s map page.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createBishalSandipMatch();
