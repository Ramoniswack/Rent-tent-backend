const mongoose = require('mongoose');
require('dotenv').config();

const Match = require('../models/Match');
const User = require('../models/User');

async function getCurrentUserLikes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user email from command line
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('❌ Please provide a user email');
      console.log('Usage: node scripts/getCurrentUserLikes.js <email>');
      console.log('Example: node scripts/getCurrentUserLikes.js bishal@example.com\n');
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${userEmail}\n`);
      process.exit(1);
    }

    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`   ID: ${user._id}\n`);

    // Get "Liked You" matches
    console.log('📥 LIKED YOU (users who liked you):');
    console.log('='.repeat(60));
    
    const likedYouMatches = await Match.find({
      $or: [
        { user1: user._id, user2Status: 'like', user1Status: { $ne: 'like' }, matched: false },
        { user2: user._id, user1Status: 'like', user2Status: { $ne: 'like' }, matched: false },
        { user1: user._id, user2Liked: true, user1Liked: false, matched: false },
        { user2: user._id, user1Liked: true, user2Liked: false, matched: false }
      ]
    })
    .populate('user1', 'name username email')
    .populate('user2', 'name username email')
    .sort({ createdAt: -1 });

    if (likedYouMatches.length === 0) {
      console.log('   No one has liked you yet\n');
    } else {
      likedYouMatches.forEach((match, idx) => {
        const otherUser = match.user1._id.toString() === user._id.toString() 
          ? match.user2 
          : match.user1;
        
        console.log(`   ${idx + 1}. ${otherUser.name} (@${otherUser.username})`);
        console.log(`      Email: ${otherUser.email}`);
        console.log(`      Liked at: ${match.createdAt.toLocaleString()}`);
        console.log('');
      });
    }

    // Get "Sent Likes" matches
    console.log('📤 SENT LIKES (users you liked):');
    console.log('='.repeat(60));
    
    const sentLikesMatches = await Match.find({
      $or: [
        { user1: user._id, user1Status: 'like', user2Status: { $ne: 'like' }, matched: false },
        { user2: user._id, user2Status: 'like', user1Status: { $ne: 'like' }, matched: false },
        { user1: user._id, user1Liked: true, user2Liked: false, matched: false },
        { user2: user._id, user2Liked: true, user1Liked: false, matched: false }
      ]
    })
    .populate('user1', 'name username email')
    .populate('user2', 'name username email')
    .sort({ createdAt: -1 });

    if (sentLikesMatches.length === 0) {
      console.log('   You haven\'t liked anyone yet\n');
    } else {
      sentLikesMatches.forEach((match, idx) => {
        const otherUser = match.user1._id.toString() === user._id.toString() 
          ? match.user2 
          : match.user1;
        
        console.log(`   ${idx + 1}. ${otherUser.name} (@${otherUser.username})`);
        console.log(`      Email: ${otherUser.email}`);
        console.log(`      Liked at: ${match.createdAt.toLocaleString()}`);
        console.log('');
      });
    }

    // Get matched users
    console.log('💚 MATCHED (mutual likes):');
    console.log('='.repeat(60));
    
    const matchedUsers = await Match.find({
      $or: [
        { user1: user._id, matched: true },
        { user2: user._id, matched: true }
      ]
    })
    .populate('user1', 'name username email')
    .populate('user2', 'name username email')
    .sort({ matchedAt: -1 });

    if (matchedUsers.length === 0) {
      console.log('   No matches yet\n');
    } else {
      matchedUsers.forEach((match, idx) => {
        const otherUser = match.user1._id.toString() === user._id.toString() 
          ? match.user2 
          : match.user1;
        
        console.log(`   ${idx + 1}. ${otherUser.name} (@${otherUser.username})`);
        console.log(`      Email: ${otherUser.email}`);
        console.log(`      Matched at: ${match.matchedAt.toLocaleString()}`);
        console.log('');
      });
    }

    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`   Liked You: ${likedYouMatches.length}`);
    console.log(`   Sent Likes: ${sentLikesMatches.length}`);
    console.log(`   Matched: ${matchedUsers.length}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getCurrentUserLikes();
