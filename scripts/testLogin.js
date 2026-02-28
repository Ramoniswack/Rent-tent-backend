require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('🧪 Testing Login API...\n');

    console.log('Attempting to login with:');
    console.log('Email: baniya@baniya.baniya');
    console.log('Password: bishal1234\n');

    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'baniya@baniya.baniya',
      password: 'bishal1234'
    });

    console.log('✅ Login successful!');
    console.log('\nResponse:');
    console.log('Token:', response.data.token?.substring(0, 50) + '...');
    console.log('User:', response.data.user);

  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin();
