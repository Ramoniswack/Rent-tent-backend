const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Match = require('../models/Match');

async function testMatchPopup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get two test users
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('Need at least 2 users in the database');
      process.exit(1);
    }

    const user1 = users[0];
    const user2 = users[1];

    console.log('\n=== Test Users ===');
    console.log(`User 1: ${user1.name} (${user1._id})`);
    console.log(`User 2: ${user2.name} (${user2._id})`);

    // Clear any existing match between these users
    await Match.deleteMany({
      $or: [
        { user1: user1._id, user2: user2._id },
        { user1: user2._id, user2: user1._id }
      ]
    });
    console.log('\n✓ Cleared existing matches');

    // Simulate User 1 liking User 2
    const [sortedUser1, sortedUser2] = [user1._id.toString(), user2._id.toString()].sort();
    const isUser1First = user1._id.toString() === sortedUser1;

    let match = new Match({
      user1: sortedUser1,
      user2: sortedUser2,
      user1Liked: isUser1First,
      user2Liked: !isUser1First
    });
    await match.save();
    console.log('\n✓ User 1 liked User 2');
    console.log(`Match status: ${match.checkMatch() ? 'MATCHED' : 'NOT MATCHED'}`);

    // Simulate User 2 liking User 1 (this should create a match)
    if (isUser1First) {
      match.user2Liked = true;
    } else {
      match.user1Liked = true;
    }
    
    const isMatch = match.checkMatch();
    if (isMatch) {
      match.matched = true;
      match.matchedAt = new Date();
    }
    await match.save();

    console.log('\n✓ User 2 liked User 1');
    console.log(`Match status: ${isMatch ? 'MATCHED ✨' : 'NOT MATCHED'}`);

    if (isMatch) {
      console.log('\n=== Match Details ===');
      console.log(`Match ID: ${match._id}`);
      console.log(`User 1: ${user1.name}`);
      console.log(`User 2: ${user2.name}`);
      console.log(`Matched At: ${match.matchedAt}`);
      
      console.log('\n=== Expected API Response ===');
      const expectedResponse = {
        liked: true,
        matched: true,
        match: match,
        matchedUser: {
          id: user2._id.toString(),
          name: user2.name,
          username: user2.username,
          profilePicture: user2.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user2.name)}&background=random`,
          bio: user2.bio || ''
        }
      };
      console.log(JSON.stringify(expectedResponse, null, 2));
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\nTo test in the app:');
    console.log(`1. Login as ${user1.name}`);
    console.log(`2. Go to /match page`);
    console.log(`3. Like ${user2.name}`);
    console.log(`4. The match success popup should appear!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testMatchPopup();
