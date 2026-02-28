const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function addUsernamesToUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users without a username
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    console.log(`Found ${usersWithoutUsername.length} users without usernames`);

    for (const user of usersWithoutUsername) {
      let username = null;

      // Try to generate username from email
      if (user.email) {
        username = user.email.split('@')[0];
      }

      // If still no username, try to generate from name
      if (!username && user.name) {
        username = user.name.toLowerCase().replace(/\s+/g, '');
      }

      // Last resort: generate a random username
      if (!username) {
        username = `user_${user._id.toString().substring(0, 8)}`;
      }

      // Check if username already exists
      let finalUsername = username;
      let counter = 1;
      while (await User.findOne({ username: finalUsername, _id: { $ne: user._id } })) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      // Update the user
      user.username = finalUsername;
      await user.save();

      console.log(`✓ Added username "${finalUsername}" to user: ${user.name || user.email}`);
    }

    console.log('\n✅ All users now have usernames!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUsernamesToUsers();
