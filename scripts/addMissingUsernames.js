const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

// Generate unique username from name
const generateUsername = async (name, userId) => {
  // Convert name to lowercase and remove special characters
  let baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15); // Limit to 15 characters
  
  if (!baseUsername) {
    baseUsername = 'user';
  }
  
  // Check if username exists
  let username = baseUsername;
  let counter = 1;
  
  while (await User.findOne({ username, _id: { $ne: userId } })) {
    // Add random number if username exists
    const randomNum = Math.floor(Math.random() * 9999);
    username = `${baseUsername}${randomNum}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 10) {
      username = `${baseUsername}${Date.now()}`;
      break;
    }
  }
  
  return username;
};

async function addMissingUsernames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users without usernames
    const usersWithoutUsername = await User.find({ 
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    console.log(`\nFound ${usersWithoutUsername.length} users without usernames`);

    for (const user of usersWithoutUsername) {
      const username = await generateUsername(user.name, user._id);
      user.username = username;
      await user.save();
      console.log(`✓ Added username "${username}" for ${user.name} (${user.email})`);
    }

    console.log('\n✅ All usernames added successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

addMissingUsernames();
