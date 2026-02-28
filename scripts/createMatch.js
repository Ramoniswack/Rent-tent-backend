require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');

async function createMatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length !== 2) {
      console.log('Usage: node createMatch.js <email1> <email2>');
      console.log('Example: node createMatch.js user1@example.com user2@example.com\n');
      
      // Show available users
      const users = await User.find().select('email name');
      console.log('Available users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name})`);
      });
      process.exit(0);
    }

    const [email1, email2] = args;

    // Find users
    const user1 = await User.findOne({ email: email1 });
    const user2 = await User.findOne({ email: email2 });

    if (!user1) {
      console.log(`❌ User not found: ${email1}`);
      process.exit(1);
    }

    if (!user2) {
      console.log(`❌ User not found: ${email2}`);
      process.exit(1);
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      users: { $all: [user1._id, user2._id] }
    });

    if (existingMatch) {
      console.log(`⚠️  Match already exists between ${user1.name} and ${user2.name}`);
      process.exit(0);
    }

    // Create match
    const match = await Match.create({
      users: [user1._id, user2._id],
      status: 'matched'
    });

    console.log(`✅ Match created successfully!`);
    console.log(`   ${user1.name} (${user1.email})`);
    console.log(`   ↔️`);
    console.log(`   ${user2.name} (${user2.email})`);
    console.log(`\nMatch ID: ${match._id}`);

  } catch (error) {
    console.error('❌ Error creating match:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createMatch();
