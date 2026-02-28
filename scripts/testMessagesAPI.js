require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testMessagesAPI() {
  try {
    console.log('🧪 Testing Messages API...\n');

    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'mr.bishal.baniya@gmail.com',
      password: 'bishal123'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id || loginResponse.data.user._id;
    console.log('✅ Logged in successfully');
    console.log('User ID:', userId);
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Test getMatches endpoint
    console.log('2. Testing GET /api/messages/matches...');
    const matchesResponse = await axios.get(`${API_URL}/messages/matches`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Matches fetched successfully');
    console.log('Total conversations:', matchesResponse.data.length);
    
    if (matchesResponse.data.length > 0) {
      console.log('\nConversation details:');
      matchesResponse.data.forEach((match, index) => {
        console.log(`\n${index + 1}. ${match.name}`);
        console.log(`   ID: ${match.id}`);
        console.log(`   Source: ${match.source || 'NOT SET'}`);
        console.log(`   Last Message: ${match.lastMessage}`);
        console.log(`   Unread: ${match.unread}`);
      });

      // Check source distribution
      const sources = matchesResponse.data.reduce((acc, match) => {
        const source = match.source || 'undefined';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Source Distribution:');
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
      });
    } else {
      console.log('⚠️  No conversations found');
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMessagesAPI();
