const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Destination = require('../models/Destination');
const Trip = require('../models/Trip');

async function checkStopCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all trips
    const trips = await Trip.find().select('_id title destination');
    console.log(`\nFound ${trips.length} trips\n`);

    for (const trip of trips) {
      console.log(`\n📍 Trip: ${trip.title} (${trip.destination})`);
      console.log(`   ID: ${trip._id}`);
      
      // Get stops for this trip
      const stops = await Destination.find({ tripId: trip._id }).sort({ time: 1 });
      console.log(`   Stops: ${stops.length}`);
      
      if (stops.length > 0) {
        stops.forEach((stop, index) => {
          const hasCoords = stop.lat && stop.lng;
          const coordStatus = hasCoords ? '✓ HAS COORDS' : '✗ NO COORDS';
          const coords = hasCoords ? `(${stop.lat}, ${stop.lng})` : '';
          console.log(`   ${index + 1}. ${stop.name} - ${coordStatus} ${coords}`);
        });
        
        const stopsWithCoords = stops.filter(s => s.lat && s.lng).length;
        const stopsWithoutCoords = stops.length - stopsWithCoords;
        
        console.log(`\n   Summary: ${stopsWithCoords} with coords, ${stopsWithoutCoords} without coords`);
      }
    }

    console.log('\n✅ Check complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStopCoordinates();
