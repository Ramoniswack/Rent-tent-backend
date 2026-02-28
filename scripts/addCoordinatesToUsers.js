const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Sample coordinates for different locations
const locationCoordinates = {
  'Kathmandu': { lat: 27.7172, lng: 85.3240 },
  'Pokhara': { lat: 28.2096, lng: 83.9856 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Toronto': { lat: 43.6532, lng: -79.3832 },
  'Vancouver': { lat: 49.2827, lng: -123.1207 }
};

async function addCoordinatesToUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users without coordinates
    const users = await User.find({
      $or: [
        { 'coordinates.lat': { $exists: false } },
        { 'coordinates.lng': { $exists: false } },
        { 'coordinates.lat': null },
        { 'coordinates.lng': null }
      ]
    });

    console.log(`Found ${users.length} users without coordinates`);

    let updated = 0;
    for (const user of users) {
      if (user.location) {
        // Try to find matching coordinates
        let coords = null;
        
        // Check for exact match
        for (const [city, coordinates] of Object.entries(locationCoordinates)) {
          if (user.location.toLowerCase().includes(city.toLowerCase())) {
            coords = coordinates;
            break;
          }
        }

        // If no match, assign random coordinates (for demo purposes)
        if (!coords) {
          const cities = Object.values(locationCoordinates);
          coords = cities[Math.floor(Math.random() * cities.length)];
        }

        user.coordinates = coords;
        await user.save();
        console.log(`Updated ${user.name} (${user.location}) with coordinates: ${coords.lat}, ${coords.lng}`);
        updated++;
      } else {
        // Assign default coordinates (Kathmandu)
        user.coordinates = { lat: 27.7172, lng: 85.3240 };
        await user.save();
        console.log(`Updated ${user.name} (no location) with default coordinates`);
        updated++;
      }
    }

    console.log(`\nSuccessfully updated ${updated} users with coordinates`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCoordinatesToUsers();
