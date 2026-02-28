require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');

async function testMatchFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get two test users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('Need at least 2 users in database');
      process.exit(1);
    }

    const user1 = users[0];
    const user2 = users[1];

    console.log('\n=== Test Users ===');
    console.log('User 1:', user1.name, user1._id);
    console.log('User 2:', user2.name, user2._id);

    // Clear any existing match between these users
    await Match.deleteMany({
      $or: [
        { user1: user1._id, user2: user2._id },
        { user1: user2._id, user2: user1._id }
      ]
    });
    console.log('\n✓ Cleared existing matches');

    // Simulate user1 liking user2
    const [sortedUser1, sortedUser2] = [user1._id.toString(), user2._id.toString()].sort();
    const isUser1First = user1._id.toString() === sortedUser1;

    let match = new Match({
      user1: sortedUser1,
      user2: sortedUser2,
      user1Liked: isUser1First,
      user2Liked: !isUser1First,
      user1Status: isUser1First ? 'like' : 'none',
      user2Status: isUser1First ? 'none' : 'like'
    });
    await match.save();
    console.log('\n✓ User 1 liked User 2');
    console.log('Match status:', match.matched);

    // Simulate user2 liking user1 back
    if (isUser1First) {
      match.user2Liked = true;
      match.user2Status = 'like';
    } else {
      match.user1Liked = true;
      match.user1Status = 'like';
    }
    
    const isMatch = match.checkMatch();
    await match.save();

    console.log('\n✓ User 2 liked User 1 back');
    console.log('Match status:', match.matched);
    console.log('Is Match:', isMatch);

    // Simulate what the API would return
    const apiResponse = {
      liked: true,
      matched: isMatch,
      match: isMatch ? match : null,
      matchedUser: isMatch ? {
        id: user1._id.toString(),
        name: user1.name,
        username: user1.username,
        profilePicture: user1.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user1.name)}&background=random`,
        bio: user1.bio || ''
      } : undefined
    };

    console.log('\n=== API Response ===');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n✓ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMatchFlow();
