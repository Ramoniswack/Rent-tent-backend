const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function createTestMessage() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the two users
    const user1 = await User.findOne({ email: 'mr.bishal.baniya@gmail.com' });
    const user2 = await User.findOne({ email: 'sushmitakunwar7266@gmail.com' });

    if (!user1 || !user2) {
      console.log('❌ One or both users not found');
      process.exit(1);
    }

    console.log('✅ Found users:');
    console.log(`   User 1: ${user1.name} (${user1._id})`);
    console.log(`   User 2: ${user2.name} (${user2._id})`);
    console.log('');

    // Create a test message from user1 to user2
    const message1 = new Message({
      sender: user1._id,
      receiver: user2._id,
      text: 'Hi! I saw your profile and would love to connect for travel adventures!',
      type: 'text',
      read: false
    });

    await message1.save();
    console.log('✅ Created message from', user1.name, 'to', user2.name);

    // Create a reply from user2 to user1
    const message2 = new Message({
      sender: user2._id,
      receiver: user1._id,
      text: 'Hey! That sounds great! I\'m planning a trip soon. Would love to chat about it!',
      type: 'text',
      read: false
    });

    await message2.save();
    console.log('✅ Created reply from', user2.name, 'to', user1.name);

    console.log('');
    console.log('💬 Test conversation created!');
    console.log('   Both users will now see each other in their messages page');
    console.log('');
    console.log('📱 To view:');
    console.log('   1. Login as', user1.email);
    console.log('   2. Go to http://localhost:3000/messages');
    console.log('   3. You should see', user2.name, 'in the conversation list');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createTestMessage();
