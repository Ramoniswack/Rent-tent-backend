const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkConnectionStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('name email username followers following');

    console.log('=== USER CONNECTION STATUS ===\n');

    for (const user of users) {
      console.log(`User: ${user.name} (${user.username || user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Followers (${user.followers?.length || 0}):`);
      
      if (user.followers && user.followers.length > 0) {
        for (const followerId of user.followers) {
          const follower = await User.findById(followerId).select('name username email');
          if (follower) {
            console.log(`    - ${follower.name} (${follower.username || follower.email})`);
          }
        }
      } else {
        console.log('    (none)');
      }
      
      console.log(`  Following (${user.following?.length || 0}):`);
      if (user.following && user.following.length > 0) {
        for (const followingId of user.following) {
          const following = await User.findById(followingId).select('name username email');
          if (following) {
            console.log(`    - ${following.name} (${following.username || following.email})`);
          }
        }
      } else {
        console.log('    (none)');
      }
      
      console.log('');
    }

    // Check for mutual connections
    console.log('\n=== MUTUAL CONNECTIONS ===\n');
    
    for (const user of users) {
      const mutualConnections = [];
      
      if (user.followers && user.following) {
        for (const followerId of user.followers) {
          if (user.following.includes(followerId)) {
            const mutualUser = await User.findById(followerId).select('name username email');
            if (mutualUser) {
              mutualConnections.push(mutualUser);
            }
          }
        }
      }
      
      if (mutualConnections.length > 0) {
        console.log(`${user.name} has mutual connections with:`);
        for (const mutual of mutualConnections) {
          console.log(`  - ${mutual.name} (${mutual.username || mutual.email})`);
        }
        console.log('');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkConnectionStatus();
