const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function deleteMessages() {
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

    // Delete messages between them
    const result = await Message.deleteMany({
      $or: [
        { sender: user1._id, receiver: user2._id },
        { sender: user2._id, receiver: user1._id }
      ]
    });

    console.log(`✅ Deleted ${result.deletedCount} messages between ${user1.name} and ${user2.name}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

deleteMessages();
