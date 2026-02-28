const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Get token from command line or use default
const token = process.argv[2];

if (!token) {
  console.log('❌ Please provide a JWT token');
  console.log('Usage: node scripts/testLikesAPI.js <your_jwt_token>');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Type: localStorage.getItem("token")');
  console.log('4. Copy the token (without quotes)');
  console.log('5. Run: node scripts/testLikesAPI.js YOUR_TOKEN_HERE\n');
  process.exit(1);
}

async function testLikesAPI() {
  console.log('🧪 Testing Likes API Endpoints\n');
  console.log('=' .repeat(60));

  try {
    // Test "Liked You" endpoint
    console.log('\n📥 Testing GET /api/matches/likes (Liked You)...');
    const likedYouResponse = await axios.get(`${API_URL}/matches/likes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Status: ${likedYouResponse.status}`);
    console.log(`✅ Data received: ${likedYouResponse.data.length} users`);
    
    if (likedYouResponse.data.length > 0) {
      console.log('\n   Users who liked you:');
      likedYouResponse.data.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.user.name} (@${item.user.username})`);
        console.log(`      Liked at: ${new Date(item.likedAt).toLocaleString()}`);
      });
    } else {
      console.log('   No users have liked you yet');
    }

    // Test "Sent Likes" endpoint
    console.log('\n📤 Testing GET /api/matches/sent (Sent Likes)...');
    const sentLikesResponse = await axios.get(`${API_URL}/matches/sent`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Status: ${sentLikesResponse.status}`);
    console.log(`✅ Data received: ${sentLikesResponse.data.length} users`);
    
    if (sentLikesResponse.data.length > 0) {
      console.log('\n   Users you have liked:');
      sentLikesResponse.data.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.user.name} (@${item.user.username})`);
        console.log(`      Liked at: ${new Date(item.likedAt).toLocaleString()}`);
      });
    } else {
      console.log('   You haven\'t liked anyone yet');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All API tests passed!');
    console.log('='.repeat(60));
    console.log('\n💡 If the frontend still shows empty:');
    console.log('   1. Make sure you\'re logged in');
    console.log('   2. Clear browser cache and reload');
    console.log('   3. Check browser console for errors');
    console.log('   4. Check Network tab for failed API calls\n');

  } catch (error) {
    console.error('\n❌ API Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure backend is running (npm start)');
    console.log('   - Check if token is valid (not expired)');
    console.log('   - Try logging out and back in to get a new token\n');
    process.exit(1);
  }
}

testLikesAPI();
