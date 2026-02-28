require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');

async function createCompletedTrip() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No users found. Please create a user first.');
      console.log('\nRun: node scripts/createAdmin.js');
      process.exit(1);
    }

    console.log(`Found user: ${user.email}\n`);

    // Create a completed trip with coordinates
    const trip = await Trip.create({
      title: 'Everest Base Camp Trek',
      destination: 'Everest Base Camp',
      country: 'Nepal',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-30'),
      status: 'completed',
      userId: user._id,
      lat: 28.0026,
      lng: 86.8528,
      budget: 2000,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
      isPublic: true
    });

    console.log('✅ Completed trip created successfully!\n');
    console.log('Trip Details:');
    console.log('─────────────────────────────────────');
    console.log(`ID:          ${trip._id}`);
    console.log(`Title:       ${trip.title}`);
    console.log(`Destination: ${trip.destination}, ${trip.country}`);
    console.log(`Dates:       ${trip.startDate.toLocaleDateString()} - ${trip.endDate.toLocaleDateString()}`);
    console.log(`Status:      ${trip.status}`);
    console.log(`Coordinates: ${trip.lat}, ${trip.lng}`);
    console.log(`Budget:      $${trip.budget} ${trip.currency}`);
    console.log(`Public:      ${trip.isPublic ? 'Yes' : 'No'}`);
    console.log('─────────────────────────────────────\n');
    
    console.log('View on map:');
    console.log('http://localhost:3000/map');
    console.log('(Click the "Completed" filter button)\n');
    
    console.log('View trip details:');
    console.log(`http://localhost:3000/trips/${trip._id}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createCompletedTrip();
