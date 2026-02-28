require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

async function markCompleted() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const now = new Date();
    
    // Find trips that should be marked as completed
    const pastTrips = await Trip.find({
      endDate: { $lt: now },
      status: { $ne: 'completed' }
    });

    console.log(`\nFound ${pastTrips.length} past trips to mark as completed\n`);

    if (pastTrips.length === 0) {
      console.log('✅ No trips need to be updated!');
      process.exit(0);
    }

    // Show details before updating
    pastTrips.forEach(trip => {
      console.log(`- ${trip.title}`);
      console.log(`  End Date: ${trip.endDate.toLocaleDateString()}`);
      console.log(`  Current Status: ${trip.status}`);
      console.log('');
    });

    // Update all at once
    const result = await Trip.updateMany(
      { 
        endDate: { $lt: now },
        status: { $ne: 'completed' }
      },
      { $set: { status: 'completed' } }
    );

    console.log(`✅ Marked ${result.modifiedCount} past trip${result.modifiedCount !== 1 ? 's' : ''} as completed!`);
    console.log('\nYou can now view completed trips on the map:');
    console.log('http://localhost:3000/map');
    console.log('(Click the "Completed" filter button)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

markCompleted();
