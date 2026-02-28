require('dotenv').config();
const axios = require('axios');

async function testWeather() {
  try {
    console.log('Testing weather API for Neshyang coordinates...');
    console.log('Lat: 28.7519871, Lon: 83.9573157');
    console.log('API Key:', process.env.OPENWEATHER_API_KEY ? 'Found' : 'Missing');
    
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: 28.7519871,
        lon: 83.9573157,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });
    
    console.log('\n=== Weather Data ===');
    console.log('Location:', response.data.name);
    console.log('Temperature:', Math.round(response.data.main.temp), '°C');
    console.log('Feels Like:', Math.round(response.data.main.feels_like), '°C');
    console.log('Condition:', response.data.weather[0].main);
    console.log('Description:', response.data.weather[0].description);
    console.log('Humidity:', response.data.main.humidity, '%');
    console.log('Coordinates:', response.data.coord);
    console.log('\nFull response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testWeather();
