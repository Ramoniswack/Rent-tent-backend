require('dotenv').config();
const axios = require('axios');

async function testContactAPI() {
  const apiUrl = 'http://localhost:5000/api/contact';
  
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    topic: 'General Inquiry',
    message: 'This is a test message from the contact form API test script.'
  };

  console.log('Testing Contact API...');
  console.log('URL:', apiUrl);
  console.log('Data:', testData);
  console.log('');

  try {
    const response = await axios.post(apiUrl, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.error('❌ API Error:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
      console.error('Make sure to run: npm run dev');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testContactAPI();
