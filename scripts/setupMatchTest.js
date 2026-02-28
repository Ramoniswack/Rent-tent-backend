const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Match = require('../models/Match');

async function setupMatchTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get two test users
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users in the database');
      process.exit(1);
    }

    const user1 = users[0];
    const user2 = users[1];

    console.log('\n=== Setting up Match Test ===');
    console.log(`User 1: ${user1.name} (${user1.email})`);
    console.log(`User 2: ${user2.name} (${user2.email})`);

    // Clear any existing match between these users
    const deleted = await Match.deleteMany({
      $or: [
        { user1: user1._id, user2: user2._id },
        { user1: user2._id, user2: user1._id }
      ]
    });
    console.log(`\n✓ Cleared ${deleted.deletedCount} existing matches`);

    // Create a match where User 2 has already liked User 1
    const [sortedUser1, sortedUser2] = [user1._id.toString(), user2._id.toString()].sort();
    const isUser1First = user1._id.toString() === sortedUser1;

    const match = new Match({
      user1: sortedUser1,
      user2: sortedUser2,
      user1Liked: !isUser1First, // User 2 already liked
      user2Liked: isUser1First,  // User 2 already liked
      user1Status: !isUser1First ? 'like' : 'none',
      user2Status: isUser1First ? 'like' : 'none'
    });
    await match.save();

    console.log('\n✓ Created match record where User 2 has already liked User 1');
    console.log(`  Match ID: ${match._id}`);
    console.log(`  User 1 liked: ${isUser1First ? match.user1Liked : match.user2Liked}`);
    console.log(`  User 2 liked: ${isUser1First ? match.user2Liked : match.user1Liked}`);

    console.log('\n=== Test Instructions ===');
    console.log('1. Open http://localhost:3000/login');
    console.log(`2. Login as: ${user1.email}`);
    console.log('3. Go to http://localhost:3000/match');
    console.log(`4. Find and LIKE ${user2.name}`);
    console.log('5. 🎉 The Match Success popup should appear!');
    console.log('\n=== Expected Behavior ===');
    console.log('✓ Confetti animation');
    console.log('✓ Both profile pictures displayed');
    console.log('✓ "It\'s a Match!" message');
    console.log('✓ "Send a Message" button');
    console.log('✓ "Keep Exploring" button');

    console.log('\n✅ Setup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

setupMatchTest();
