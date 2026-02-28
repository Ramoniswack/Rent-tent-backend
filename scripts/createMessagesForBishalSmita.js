const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function createMessagesForBishalSmita() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the two users
    const user1 = await User.findOne({ email: 'baniya@baniya.baniya' });
    const user2 = await User.findOne({ email: 'sushkunwar7266@gmail.com' });

    if (!user1) {
      console.log('❌ User baniya@baniya.baniya not found');
      process.exit(1);
    }

    if (!user2) {
      console.log('❌ User sushkunwar7266@gmail.com not found');
      process.exit(1);
    }

    console.log('✅ Found users:');
    console.log(`   User 1: ${user1.name} (${user1._id})`);
    console.log(`   User 2: ${user2.name} (${user2._id})`);
    console.log('');

    // Check if messages already exist
    const existingMessages = await Message.find({
      $or: [
        { sender: user1._id, receiver: user2._id },
        { sender: user2._id, receiver: user1._id }
      ]
    });

    if (existingMessages.length > 0) {
      console.log(`⚠️  ${existingMessages.length} messages already exist between these users`);
      console.log('   Delete them first with: node scripts/deleteMessagesBetweenUsers.js');
      process.exit(0);
    }

    // Create a test message from user1 to user2
    const message1 = new Message({
      sender: user1._id,
      receiver: user2._id,
      text: 'Hey! I saw your profile. Would love to connect and maybe plan a trip together!',
      type: 'text',
      read: false
    });

    await message1.save();
    console.log('✅ Created message from', user1.name, 'to', user2.name);

    // Create a reply from user2 to user1
    const message2 = new Message({
      sender: user2._id,
      receiver: user1._id,
      text: 'Hi! That sounds amazing! I\'m always looking for travel buddies. What destinations are you interested in?',
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
    console.log(`   1. Login as ${user1.email}`);
    console.log('   2. Go to http://localhost:3000/messages');
    console.log(`   3. You should see ${user2.name} in the conversation list`);
    console.log('');
    console.log(`   OR login as ${user2.email} to see ${user1.name}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createMessagesForBishalSmita();
