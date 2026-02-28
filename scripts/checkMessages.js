const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function checkMessages() {
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

    // Check for messages between them
    const messages = await Message.find({
      $or: [
        { sender: user1._id, receiver: user2._id },
        { sender: user2._id, receiver: user1._id }
      ]
    }).sort({ createdAt: 1 });

    console.log(`📨 Found ${messages.length} messages between them\n`);

    if (messages.length > 0) {
      console.log('Messages:');
      messages.forEach((msg, index) => {
        const senderName = msg.sender.toString() === user1._id.toString() ? user1.name : user2.name;
        const receiverName = msg.receiver.toString() === user1._id.toString() ? user1.name : user2.name;
        console.log(`${index + 1}. ${senderName} → ${receiverName}: "${msg.text || msg.image || '[No content]'}"`);
        console.log(`   Sent: ${msg.createdAt}`);
        console.log(`   Read: ${msg.read ? 'Yes' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('💡 No messages found between these users');
      console.log('   They will NOT appear in each other\'s messages page');
      console.log('');
      console.log('🔧 To make them appear:');
      console.log('   1. Send a message from one user to the other');
      console.log('   2. Or run: node scripts/createTestMessage.js');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkMessages();
