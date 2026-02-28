require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

// Common destinations with coordinates
const destinationCoords = {
  'kathmandu': { lat: 27.7172, lng: 85.3240 },
  'pokhara': { lat: 28.2096, lng: 83.9856 },
  'everest': { lat: 28.0026, lng: 86.8528 },
  'annapurna': { lat: 28.5967, lng: 83.8203 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'kyoto': { lat: 35.0116, lng: 135.7681 },
  'osaka': { lat: 34.6937, lng: 135.5023 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'auckland': { lat: -36.8485, lng: 174.7633 },
  'bali': { lat: -8.3405, lng: 115.0920 },
  'phuket': { lat: 7.8804, lng: 98.3923 },
  'maldives': { lat: 3.2028, lng: 73.2207 },
  'santorini': { lat: 36.3932, lng: 25.4615 },
  'mykonos': { lat: 37.4467, lng: 25.3289 },
  'default': { lat: 27.7172, lng: 85.3240 } // Default to Kathmandu
};

async function addCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const tripsWithoutCoords = await Trip.find({
      $or: [
        { lat: { $exists: false } },
        { lng: { $exists: false } },
        { lat: null },
        { lng: null }
      ]
    });

    console.log(`\nFound ${tripsWithoutCoords.length} trips without coordinates\n`);

    if (tripsWithoutCoords.length === 0) {
      console.log('✅ All trips already have coordinates!');
      process.exit(0);
    }

    let updated = 0;
    for (const trip of tripsWithoutCoords) {
      const destination = trip.destination.toLowerCase();
      let coords = destinationCoords.default;
      let matchedKey = 'default';

      // Try to match destination
      for (const [key, value] of Object.entries(destinationCoords)) {
        if (destination.includes(key)) {
          coords = value;
          matchedKey = key;
          break;
        }
      }

      trip.lat = coords.lat;
      trip.lng = coords.lng;
      await trip.save();

      console.log(`✓ Updated "${trip.title}"`);
      console.log(`  Destination: ${trip.destination}`);
      console.log(`  Matched: ${matchedKey}`);
      console.log(`  Coordinates: ${coords.lat}, ${coords.lng}`);
      console.log(`  Status: ${trip.status}`);
      console.log('');
      
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} trip${updated !== 1 ? 's' : ''}!`);
    console.log('\nYou can now view these trips on the map:');
    console.log('http://localhost:3000/map');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCoordinates();
