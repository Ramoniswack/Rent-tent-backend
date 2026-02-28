require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

async function checkTrip() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the manang trip
    const trip = await Trip.findOne({ title: /manang/i });
    
    if (!trip) {
      console.log('Manang trip not found');
      return;
    }

    console.log('=== MANANG TRIP ===');
    console.log('ID:', trip._id);
    console.log('Title:', trip.title);
    console.log('Destination:', trip.destination);
    console.log('Coordinates:');
    console.log('  lat:', trip.lat);
    console.log('  lng:', trip.lng);
    console.log('  Has coordinates:', !!(trip.lat && trip.lng));
    
    if (trip.lat && trip.lng) {
      console.log('\nWeather API URL would be:');
      console.log(`http://localhost:5000/api/weather/${encodeURIComponent(trip.destination)}?lat=${trip.lat}&lon=${trip.lng}`);
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTrip();
