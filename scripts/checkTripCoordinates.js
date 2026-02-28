const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Trip = require('../models/Trip');

async function checkTripCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const trips = await Trip.find({});
    
    console.log('\n=== ALL TRIPS ===');
    console.log(`Total trips: ${trips.length}\n`);
    
    trips.forEach((trip, index) => {
      console.log(`${index + 1}. ${trip.title}`);
      console.log(`   Destination: ${trip.destination}`);
      console.log(`   Coordinates: lat=${trip.lat}, lng=${trip.lng}`);
      console.log(`   Has coordinates: ${!!(trip.lat && trip.lng)}`);
      console.log(`   Created: ${trip.createdAt}`);
      console.log('');
    });

    const tripsWithCoords = trips.filter(t => t.lat && t.lng);
    const tripsWithoutCoords = trips.filter(t => !t.lat || !t.lng);
    
    console.log(`\nTrips WITH coordinates: ${tripsWithCoords.length}`);
    console.log(`Trips WITHOUT coordinates: ${tripsWithoutCoords.length}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTripCoordinates();
