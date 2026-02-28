require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');

async function checkMatchStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const allUsers = await User.find({}).select('name username email');
    console.log(`\nTotal users: ${allUsers.length}\n`);

    // Show all users with their match interactions
    for (const user of allUsers) {
      console.log(`\n=== ${user.name} (@${user.username}) ===`);
      console.log(`Email: ${user.email}`);
      
      // Get all matches where this user is involved
      const matches = await Match.find({
        $or: [
          { user1: user._id },
          { user2: user._id }
        ]
      }).populate('user1 user2', 'name username');
      
      console.log(`Total match records: ${matches.length}`);
      
      // Count liked, passed, and matched
      const liked = matches.filter(m => {
        if (m.user1._id.toString() === user._id.toString()) {
          return m.user1Liked && !m.user2Liked;
        } else {
          return m.user2Liked && !m.user1Liked;
        }
      });
      
      const passed = matches.filter(m => {
        if (m.user1._id.toString() === user._id.toString()) {
          return m.user1Passed;
        } else {
          return m.user2Passed;
        }
      });
      
      const matched = matches.filter(m => m.matched);
      
      console.log(`  - Liked: ${liked.length}`);
      console.log(`  - Passed: ${passed.length}`);
      console.log(`  - Matched: ${matched.length}`);
      
      // Show interacted user IDs
      const interactedIds = matches.filter(m => m.user1 && m.user2).map(m => {
        if (m.user1._id.toString() === user._id.toString()) {
          return m.user2._id.toString();
        } else {
          return m.user1._id.toString();
        }
      });
      
      console.log(`  - Interacted with ${interactedIds.length} users`);
      
      // Calculate how many users are left to see
      const totalEligibleUsers = allUsers.length - 1; // Exclude self
      const usersLeft = totalEligibleUsers - interactedIds.length;
      console.log(`  - Users left to see: ${usersLeft} out of ${totalEligibleUsers}`);
    }

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMatchStatus();
