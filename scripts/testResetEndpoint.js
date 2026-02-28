require('dotenv').config();
const axios = require('axios');

async function testResetEndpoint() {
  try {
    const baseURL = 'http://localhost:5000/api';
    
    // First, let's try to login to get a token
    console.log('Testing reset endpoint...');
    
    // You would need to replace these with actual credentials
    // For now, let's just test if the endpoint exists
    const response = await axios.delete(`${baseURL}/matches/reset`, {
      headers: {
        'Authorization': 'Bearer your_token_here' // This would fail, but we can see the endpoint structure
      }
    }).catch(error => {
      if (error.response) {
        console.log('Endpoint exists! Status:', error.response.status);
        console.log('Response:', error.response.data);
        return error.response;
      }
      throw error;
    });
    
    console.log('Test completed');
    
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
  }
}

testResetEndpoint();