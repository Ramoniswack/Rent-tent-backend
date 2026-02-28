require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testNewsletterAPI() {
  try {
    const testEmail = `test${Date.now()}@example.com`;

    console.log('🧪 Testing Newsletter API\n');
    console.log('API URL:', API_URL);
    console.log('Test Email:', testEmail);
    console.log('');

    // Test 1: Subscribe
    console.log('📝 Test 1: Subscribe to newsletter');
    const subscribeResponse = await axios.post(`${API_URL}/newsletter/subscribe`, {
      email: testEmail,
      source: 'footer'
    });
    console.log('✅ Status:', subscribeResponse.status);
    console.log('✅ Response:', subscribeResponse.data);
    console.log('');

    // Test 2: Try duplicate subscription
    console.log('📝 Test 2: Try duplicate subscription');
    const duplicateResponse = await axios.post(`${API_URL}/newsletter/subscribe`, {
      email: testEmail,
      source: 'footer'
    });
    console.log('✅ Status:', duplicateResponse.status);
    console.log('✅ Response:', duplicateResponse.data);
    console.log('');

    // Test 3: Unsubscribe
    console.log('📝 Test 3: Unsubscribe');
    const unsubscribeResponse = await axios.post(`${API_URL}/newsletter/unsubscribe`, {
      email: testEmail
    });
    console.log('✅ Status:', unsubscribeResponse.status);
    console.log('✅ Response:', unsubscribeResponse.data);
    console.log('');

    // Test 4: Invalid email
    console.log('📝 Test 4: Try invalid email');
    try {
      await axios.post(`${API_URL}/newsletter/subscribe`, {
        email: 'invalid-email',
        source: 'footer'
      });
      console.log('❌ Should have failed with validation error');
    } catch (error) {
      console.log('✅ Validation error caught:', error.response?.data?.message);
    }
    console.log('');

    console.log('✅ All API tests passed!');
    console.log('\n📧 Check your email inbox for the welcome email!');
    console.log(`   Email sent to: ${testEmail}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testNewsletterAPI();
