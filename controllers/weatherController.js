const axios = require('axios');

// GET /api/weather/:city - Proxy to OpenWeatherMap API
// This endpoint acts as a proxy to fetch weather data from OpenWeatherMap
// Benefits: Keeps API key secure on backend, allows caching, and provides
// consistent error handling for the frontend
exports.getWeather = async (req, res) => {
  try {
    const { city } = req.params;
    const { lat, lon } = req.query;

    console.log('Weather request received:', {
      city,
      lat,
      lon,
      latType: typeof lat,
      lonType: typeof lon
    });

    if (!process.env.OPENWEATHER_API_KEY) {
      console.error('Weather API key not configured');
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    // Prepare API parameters - prefer coordinates over city name for accuracy
    const params = {
      appid: process.env.OPENWEATHER_API_KEY,
      units: 'metric' // Use metric units (Celsius)
    };

    // Use coordinates if provided (more accurate for remote locations)
    // Check if lat and lon are valid numbers
    const hasValidCoords = lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon));
    
    if (hasValidCoords) {
      console.log('Using coordinates:', lat, lon);
      params.lat = parseFloat(lat);
      params.lon = parseFloat(lon);
    } else {
      console.log('Using city name:', city);
      if (!city || city === 'undefined') {
        return res.status(400).json({ error: 'City name or coordinates required' });
      }
      params.q = city;
    }
    
    console.log('OpenWeatherMap API params:', { ...params, appid: '[HIDDEN]' });
    
    // Fetch current weather data from OpenWeatherMap API
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params
    });

    console.log('Weather data fetched successfully');

    // Extract relevant weather information
    const weatherData = {
      city: response.data.name,
      country: response.data.sys.country,
      temperature: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      humidity: response.data.main.humidity,
      condition: response.data.weather[0].main, // Main weather condition (e.g., "Clear", "Clouds", "Rain")
      description: response.data.weather[0].description, // Detailed description
      icon: response.data.weather[0].icon,
      windSpeed: response.data.wind.speed,
      coordinates: {
        lat: response.data.coord.lat,
        lon: response.data.coord.lon
      }
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Location not found' });
    }
    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Invalid API key' });
    }
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};
