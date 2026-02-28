require('dotenv').config();
const axios = require('axios');

async function testWeatherEndpoint() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzI5YzI5YzI5YzI5YzI5YzI5YzI5YzIiLCJpYXQiOjE3MDk1NTU1NTV9.test'; // Replace with actual token
    
    console.log('Testing weather endpoint...\n');
    
    const url = 'http://localhost:5000/api/weather/Neshyang-08%2C%20Neshyang%2C%20Manang%2C%20Gandaki%20Province%2C%20Nepal';
    const params = {
      lat: 28.7519871,
      lon: 83.9573157
    };
    
    console.log('URL:', url);
    console.log('Params:', params);
    console.log('');
    
    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('=== SUCCESS ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (err) {
    console.error('=== ERROR ===');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
    console.error('Message:', err.message);
  }
}

testWeatherEndpoint();
