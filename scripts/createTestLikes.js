const mongoose = require('mongoose');
require('dotenv').config();

const Match = require('../models/Match');
const User = require('../models/User');

async function createTestLikes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).limit(10);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users in database to create test likes');
      console.log('   Create some users first!\n');
      process.exit(1);
    }

    console.log(`📊 Found ${users.length} users\n`);
    console.log('🔄 Creating test likes...\n');

    let createdCount = 0;
    let skippedCount = 0;

    // Create various like scenarios
    for (let i = 0; i < users.length - 1; i++) {
      const user1 = users[i];
      const user2 = users[i + 1];

      // Sort user IDs
      const [sortedUser1, sortedUser2] = [user1._id.toString(), user2._id.toString()].sort();

      // Check if match already exists
      const existingMatch = await Match.findOne({
        user1: sortedUser1,
        user2: sortedUser2
      });

      if (existingMatch) {
        console.log(`⏭️  Skipped: ${user1.name} ↔ ${user2.name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create different scenarios
      const scenario = i % 3;
      let matchData;

      if (scenario === 0) {
        // User1 likes User2 (pending)
        matchData = {
          user1: sortedUser1,
          user2: sortedUser2,
          user1Status: sortedUser1 === user1._id.toString() ? 'like' : 'none',
          user2Status: sortedUser2 === user1._id.toString() ? 'like' : 'none',
          user1Liked: sortedUser1 === user1._id.toString(),
          user2Liked: sortedUser2 === user1._id.toString(),
          matched: false
        };
        console.log(`✓ Created: ${user1.name} → ${user2.name} (User1 likes User2)`);
      } else if (scenario === 1) {
        // User2 likes User1 (pending)
        matchData = {
          user1: sortedUser1,
          user2: sortedUser2,
          user1Status: sortedUser1 === user2._id.toString() ? 'like' : 'none',
          user2Status: sortedUser2 === user2._id.toString() ? 'like' : 'none',
          user1Liked: sortedUser1 === user2._id.toString(),
          user2Liked: sortedUser2 === user2._id.toString(),
          matched: false
        };
        console.log(`✓ Created: ${user2.name} → ${user1.name} (User2 likes User1)`);
      } else {
        // Both like each other (matched)
        matchData = {
          user1: sortedUser1,
          user2: sortedUser2,
          user1Status: 'like',
          user2Status: 'like',
          user1Liked: true,
          user2Liked: true,
          matched: true,
          matchedAt: new Date()
        };
        console.log(`✓ Created: ${user1.name} ↔ ${user2.name} (Matched!)`);
      }

      await Match.create(matchData);
      createdCount++;
    }

    console.log('\n📈 Summary:');
    console.log(`  - Created: ${createdCount} matches`);
    console.log(`  - Skipped: ${skippedCount} (already existed)`);
    console.log('\n✅ Test likes created successfully!\n');

    // Show what each user should see
    console.log('👀 What users should see:\n');
    
    for (const user of users.slice(0, 3)) {
      const likedYou = await Match.find({
        $or: [
          { user1: user._id, user2Status: 'like', user1Status: { $ne: 'like' }, matched: false },
          { user2: user._id, user1Status: 'like', user2Status: { $ne: 'like' }, matched: false }
        ]
      }).populate('user1 user2', 'name');

      const sentLikes = await Match.find({
        $or: [
          { user1: user._id, user1Status: 'like', user2Status: { $ne: 'like' }, matched: false },
          { user2: user._id, user2Status: 'like', user1Status: { $ne: 'like' }, matched: false }
        ]
      }).populate('user1 user2', 'name');

      console.log(`${user.name}:`);
      console.log(`  - Liked You: ${likedYou.length}`);
      console.log(`  - Sent Likes: ${sentLikes.length}`);
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestLikes();
