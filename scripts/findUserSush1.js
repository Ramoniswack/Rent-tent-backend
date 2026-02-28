const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function findUserSush1() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Search for users with "sush" in name, email, or username
    const users = await User.find({
      $or: [
        { name: /sush/i },
        { email: /sush/i },
        { username: /sush/i }
      ]
    }).select('name email username _id');

    console.log(`Found ${users.length} users matching "sush":\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });

    // Also search for mrbishalbaniya
    console.log('Searching for mrbishalbaniya...\n');
    const bishalUsers = await User.find({
      $or: [
        { name: /bishal/i },
        { email: /bishal/i },
        { username: /bishal/i }
      ]
    }).select('name email username _id');

    console.log(`Found ${bishalUsers.length} users matching "bishal":\n`);
    
    bishalUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

findUserSush1();
