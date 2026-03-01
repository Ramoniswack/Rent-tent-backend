const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Destination = require('../models/Destination');
const Trip = require('../models/Trip'); // Need to require Trip for populate to work

// Function to geocode a location name
async function geocodeLocation(locationName) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
      {
        headers: {
          'User-Agent': 'TravelBuddy-App/1.0'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to geocode "${locationName}":`, error.message);
    return null;
  }
}

// Add delay to respect Nominatim rate limits (1 request per second)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function addCoordinatesToStops() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all stops without coordinates
    const stopsWithoutCoords = await Destination.find({
      $or: [
        { lat: { $exists: false } },
        { lng: { $exists: false } },
        { lat: null },
        { lng: null }
      ]
    }).populate('tripId', 'title destination');

    console.log(`Found ${stopsWithoutCoords.length} stops without coordinates\n`);

    if (stopsWithoutCoords.length === 0) {
      console.log('✅ All stops already have coordinates!');
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const stop of stopsWithoutCoords) {
      console.log(`\nProcessing: ${stop.name}`);
      console.log(`  Trip: ${stop.tripId?.title || 'Unknown'}`);
      
      // Try to geocode the stop name
      const coords = await geocodeLocation(stop.name);
      
      if (coords) {
        stop.lat = coords.lat;
        stop.lng = coords.lng;
        await stop.save();
        console.log(`  ✓ Added coordinates: (${coords.lat}, ${coords.lng})`);
        updated++;
      } else {
        console.log(`  ✗ Could not find coordinates`);
        failed++;
      }
      
      // Wait 1 second between requests to respect rate limits
      await delay(1000);
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Summary:`);
    console.log(`  ✓ Updated: ${updated} stops`);
    console.log(`  ✗ Failed: ${failed} stops`);
    console.log(`${'='.repeat(50)}\n`);

    if (failed > 0) {
      console.log('Note: Failed stops may have invalid or too generic names.');
      console.log('You can manually edit these stops in the UI to add coordinates.\n');
    }

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCoordinatesToStops();
