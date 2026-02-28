const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials
const testUser = {
  email: 'soniklamsal111@gmail.com',
  password: 'password123' // Update this with actual password
};

async function testLikesAPISimple() {
  console.log('🧪 Testing Likes API\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, testUser);
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user._id;
    
    console.log(`✅ Logged in as: ${loginResponse.data.user.name}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Test "Liked You" endpoint
    console.log('\n📥 Step 2: Testing /api/matches/likes...');
    const likedYouResponse = await axios.get(`${API_URL}/matches/likes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Status: ${likedYouResponse.status}`);
    console.log(`✅ Liked You: ${likedYouResponse.data.length} users`);
    
    if (likedYouResponse.data.length > 0) {
      console.log('\n   Users who liked you:');
      likedYouResponse.data.slice(0, 3).forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.user.name} (@${item.user.username})`);
      });
    }

    // Step 3: Test "Sent Likes" endpoint
    console.log('\n📤 Step 3: Testing /api/matches/sent...');
    const sentLikesResponse = await axios.get(`${API_URL}/matches/sent`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Status: ${sentLikesResponse.status}`);
    console.log(`✅ Sent Likes: ${sentLikesResponse.data.length} users`);
    
    if (sentLikesResponse.data.length > 0) {
      console.log('\n   Users you liked:');
      sentLikesResponse.data.slice(0, 3).forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.user.name} (@${item.user.username})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ API is working correctly!');
    console.log('='.repeat(60));
    
    console.log('\n💡 To test in browser:');
    console.log('   1. Login as: ' + testUser.email);
    console.log('   2. Go to: http://localhost:3000/match/likes');
    console.log(`   3. Should see ${likedYouResponse.data.length} in "Liked You" tab`);
    console.log(`   4. Should see ${sentLikesResponse.data.length} in "Sent" tab\n`);

  } catch (error) {
    console.error('\n❌ Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Backend is not running!');
      console.log('   Start it with: npm start\n');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Login failed - check password in script\n');
    }
    
    process.exit(1);
  }
}

testLikesAPISimple();
