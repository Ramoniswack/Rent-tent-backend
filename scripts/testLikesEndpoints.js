const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test user credentials (use your actual test user)
const testUser = {
  email: 'baniya@baniya.baniya',
  password: 'password123'
};

async function testLikesEndpoints() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, testUser);
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n📋 Testing GET /api/matches/likes...');
    try {
      const likesRes = await axios.get(`${API_URL}/matches/likes`, { headers });
      console.log('✅ GET /api/matches/likes successful');
      console.log('Response:', JSON.stringify(likesRes.data, null, 2));
    } catch (err) {
      console.error('❌ GET /api/matches/likes failed');
      console.error('Status:', err.response?.status);
      console.error('Error:', err.response?.data);
      console.error('Full error:', err.message);
    }

    console.log('\n📋 Testing GET /api/matches/sent...');
    try {
      const sentRes = await axios.get(`${API_URL}/matches/sent`, { headers });
      console.log('✅ GET /api/matches/sent successful');
      console.log('Response:', JSON.stringify(sentRes.data, null, 2));
    } catch (err) {
      console.error('❌ GET /api/matches/sent failed');
      console.error('Status:', err.response?.status);
      console.error('Error:', err.response?.data);
      console.error('Full error:', err.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testLikesEndpoints();
