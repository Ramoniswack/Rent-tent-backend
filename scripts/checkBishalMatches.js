const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

async function checkBishalMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Bishal
    const bishal = await User.findOne({ email: 'baniya@baniya.baniya' });
    if (!bishal) {
      console.log('Bishal not found');
      return;
    }

    console.log('=== BISHAL ===');
    console.log('ID:', bishal._id);
    console.log('Name:', bishal.name);
    console.log('Email:', bishal.email);

    // Find all Match records involving Bishal
    const allMatches = await Match.find({
      $or: [
        { user1: bishal._id },
        { user2: bishal._id }
      ]
    })
    .populate('user1', 'name email username')
    .populate('user2', 'name email username');

    console.log('\n=== ALL MATCH RECORDS (including non-matched) ===');
    console.log('Total records:', allMatches.length);

    if (allMatches.length === 0) {
      console.log('No match records found for Bishal');
    } else {
      allMatches.forEach((match, index) => {
        const otherUser = match.user1._id.toString() === bishal._id.toString() 
          ? match.user2 
          : match.user1;
        
        const isUser1 = match.user1._id.toString() === bishal._id.toString();
        const bishalStatus = isUser1 ? match.user1Status : match.user2Status;
        const otherStatus = isUser1 ? match.user2Status : match.user1Status;
        
        console.log(`\n${index + 1}. ${otherUser.name} (@${otherUser.username})`);
        console.log('   Matched:', match.matched ? 'YES ✅' : 'NO ❌');
        console.log('   Bishal status:', bishalStatus);
        console.log('   Other user status:', otherStatus);
        console.log('   Created:', match.createdAt);
        if (match.matchedAt) {
          console.log('   Matched at:', match.matchedAt);
        }
      });
    }

    // Find sandip specifically
    console.log('\n=== CHECKING SANDIP ===');
    const sandip = await User.findOne({ email: 'sandip@sandip.sandip' });
    if (sandip) {
      console.log('Sandip found:', sandip.name, '(@' + sandip.username + ')');
      
      const [user1, user2] = [bishal._id.toString(), sandip._id.toString()].sort();
      const matchWithSandip = await Match.findOne({ 
        user1: new mongoose.Types.ObjectId(user1),
        user2: new mongoose.Types.ObjectId(user2)
      });
      
      if (matchWithSandip) {
        console.log('Match record exists:');
        console.log('  Matched:', matchWithSandip.matched ? 'YES ✅' : 'NO ❌');
        console.log('  User1 status:', matchWithSandip.user1Status);
        console.log('  User2 status:', matchWithSandip.user2Status);
      } else {
        console.log('No match record found with Sandip ❌');
      }
    } else {
      console.log('Sandip not found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkBishalMatches();
