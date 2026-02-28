require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');

async function seedMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find();
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create matches. Please create more users first.');
      process.exit(0);
    }

    console.log(`Found ${users.length} users`);

    // Create matches between first user and others
    const mainUser = users[0];
    console.log(`\nCreating matches for: ${mainUser.name} (${mainUser.email})`);

    for (let i = 1; i < Math.min(users.length, 4); i++) {
      const otherUser = users[i];

      // Check if match already exists
      const existingMatch = await Match.findOne({
        users: { $all: [mainUser._id, otherUser._id] }
      });

      if (existingMatch) {
        console.log(`✓ Match already exists with ${otherUser.name}`);
        continue;
      }

      // Create match
      const match = await Match.create({
        users: [mainUser._id, otherUser._id],
        status: 'matched'
      });

      console.log(`✓ Created match with ${otherUser.name}`);

      // Create some sample messages
      const messages = [
        {
          sender: otherUser._id,
          receiver: mainUser._id,
          text: `Hey ${mainUser.name}! Are you ready for the trek?`,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          sender: mainUser._id,
          receiver: otherUser._id,
          text: 'Yes! So excited! Have you done this before?',
          createdAt: new Date(Date.now() - 3500000)
        },
        {
          sender: otherUser._id,
          receiver: mainUser._id,
          text: 'This will be my second time. The views are incredible! 🏔️',
          createdAt: new Date(Date.now() - 3400000)
        }
      ];

      await Message.insertMany(messages);
      console.log(`  ✓ Created ${messages.length} sample messages`);
    }

    console.log('\n✅ Matches and messages seeded successfully!');
    console.log(`\nYou can now login as ${mainUser.email} to see the messages.`);

  } catch (error) {
    console.error('Error seeding matches:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

seedMatches();
