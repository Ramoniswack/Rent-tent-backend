const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Match = require('../models/Match');

const API_URL = 'http://localhost:5000/api';

async function debugFrontendIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('=' .repeat(70));
    console.log('🔍 DEBUGGING LIKES FRONTEND ISSUE');
    console.log('=' .repeat(70));

    // Step 1: Check all users
    console.log('\n📊 Step 1: Checking all users...\n');
    const users = await User.find({}).select('name username email').limit(5);
    
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (@${user.username})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user._id}`);
    });

    // Step 2: Check matches for each user
    console.log('\n\n📥 Step 2: Checking likes for each user...\n');
    
    for (const user of users) {
      const likedYou = await Match.find({
        $or: [
          { user1: user._id, user2Status: 'like', user1Status: { $ne: 'like' }, matched: false },
          { user2: user._id, user1Status: 'like', user2Status: { $ne: 'like' }, matched: false },
          { user1: user._id, user2Liked: true, user1Liked: false, matched: false },
          { user2: user._id, user1Liked: true, user2Liked: false, matched: false }
        ]
      });

      const sentLikes = await Match.find({
        $or: [
          { user1: user._id, user1Status: 'like', user2Status: { $ne: 'like' }, matched: false },
          { user2: user._id, user2Status: 'like', user1Status: { $ne: 'like' }, matched: false },
          { user1: user._id, user1Liked: true, user2Liked: false, matched: false },
          { user2: user._id, user2Liked: true, user1Liked: false, matched: false }
        ]
      });

      if (likedYou.length > 0 || sentLikes.length > 0) {
        console.log(`${user.name} (@${user.username}):`);
        console.log(`  📥 Liked You: ${likedYou.length}`);
        console.log(`  📤 Sent Likes: ${sentLikes.length}`);
        console.log('');
      }
    }

    // Step 3: Find a user with likes to test
    console.log('\n🎯 Step 3: Finding user with likes to test API...\n');
    
    let testUser = null;
    for (const user of users) {
      const likedYou = await Match.find({
        $or: [
          { user1: user._id, user2Status: 'like', user1Status: { $ne: 'like' }, matched: false },
          { user2: user._id, user1Status: 'like', user2Status: { $ne: 'like' }, matched: false }
        ]
      });

      if (likedYou.length > 0) {
        testUser = user;
        console.log(`✅ Found test user: ${user.name} (@${user.username})`);
        console.log(`   Has ${likedYou.length} users who liked them`);
        break;
      }
    }

    if (!testUser) {
      console.log('❌ No users with pending likes found');
      console.log('\n💡 Run this to create test data:');
      console.log('   node scripts/createTestLikes.js\n');
      process.exit(0);
    }

    // Step 4: Test login
    console.log('\n\n🔐 Step 4: Testing login...\n');
    console.log('⚠️  Note: This requires the user password to be "password123"');
    console.log('   If login fails, manually test with your actual password\n');

    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: 'password123'
      });

      const token = loginResponse.data.token;
      console.log(`✅ Login successful!`);
      console.log(`   Token: ${token.substring(0, 30)}...`);

      // Step 5: Test API endpoints
      console.log('\n\n🧪 Step 5: Testing API endpoints...\n');

      // Test Liked You
      console.log('Testing GET /api/matches/likes...');
      const likedYouResponse = await axios.get(`${API_URL}/matches/likes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`✅ Status: ${likedYouResponse.status}`);
      console.log(`✅ Response: ${JSON.stringify(likedYouResponse.data, null, 2).substring(0, 500)}...`);
      console.log(`✅ Count: ${likedYouResponse.data.length} users`);

      // Test Sent Likes
      console.log('\nTesting GET /api/matches/sent...');
      const sentLikesResponse = await axios.get(`${API_URL}/matches/sent`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`✅ Status: ${sentLikesResponse.status}`);
      console.log(`✅ Count: ${sentLikesResponse.data.length} users`);

      // Step 6: Summary
      console.log('\n\n' + '=' .repeat(70));
      console.log('📊 SUMMARY');
      console.log('=' .repeat(70));
      console.log(`\n✅ Backend is working correctly!`);
      console.log(`✅ API endpoints returning data`);
      console.log(`✅ User "${testUser.name}" has ${likedYouResponse.data.length} likes`);
      console.log('\n💡 To test in browser:');
      console.log(`   1. Login as: ${testUser.email}`);
      console.log(`   2. Password: password123 (or your actual password)`);
      console.log(`   3. Go to: http://localhost:3000/match/likes`);
      console.log(`   4. Should see ${likedYouResponse.data.length} users in "Liked You" tab`);
      console.log('\n🔍 If still not showing in browser:');
      console.log('   1. Open DevTools (F12) → Console tab');
      console.log('   2. Check for JavaScript errors');
      console.log('   3. Go to Network tab');
      console.log('   4. Refresh page and look for /api/matches/likes request');
      console.log('   5. Check if request is being made and what response is');
      console.log('\n📝 Your test token (use in browser console):');
      console.log(`   localStorage.setItem('token', '${token}')`);
      console.log('');

    } catch (loginError) {
      if (loginError.response?.status === 401) {
        console.log('❌ Login failed - password is not "password123"');
        console.log('\n💡 Manual testing steps:');
        console.log(`   1. Login to frontend as: ${testUser.email}`);
        console.log(`   2. Open DevTools (F12) → Console`);
        console.log(`   3. Type: localStorage.getItem('token')`);
        console.log(`   4. Copy the token`);
        console.log(`   5. Run: node scripts/testLikesAPI.js YOUR_TOKEN_HERE`);
      } else {
        throw loginError;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

debugFrontendIssue();
