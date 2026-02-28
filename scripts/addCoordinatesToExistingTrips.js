const mongoose = require('mongoose');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Trip = require('../models/Trip');

// Function to geocode a location using Nominatim
function geocodeLocation(location) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'NomadNotes/1.0'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.length > 0) {
            resolve({
              lat: parseFloat(parsed[0].lat),
              lng: parseFloat(parsed[0].lon)
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Sleep function to respect rate limits
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function addCoordinatesToExistingTrips() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const trips = await Trip.find({
      $or: [
        { lat: { $exists: false } },
        { lng: { $exists: false } },
        { lat: null },
        { lng: null }
      ]
    });
    
    console.log(`\nFound ${trips.length} trips without coordinates\n`);
    
    for (let i = 0; i < trips.length; i++) {
      const trip = trips[i];
      console.log(`${i + 1}/${trips.length} Processing: ${trip.title} (${trip.destination})`);
      
      try {
        // Geocode the destination
        const coords = await geocodeLocation(trip.destination);
        
        if (coords) {
          trip.lat = coords.lat;
          trip.lng = coords.lng;
          await trip.save();
          console.log(`   ✓ Added coordinates: ${coords.lat}, ${coords.lng}`);
        } else {
          console.log(`   ✗ Could not find coordinates for "${trip.destination}"`);
        }
        
        // Wait 1 second between requests to respect rate limits
        if (i < trips.length - 1) {
          await sleep(1000);
        }
      } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
      }
    }

    console.log('\n=== Summary ===');
    const updatedTrips = await Trip.find({
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null }
    });
    console.log(`Total trips with coordinates: ${updatedTrips.length}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCoordinatesToExistingTrips();
