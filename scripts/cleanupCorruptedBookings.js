const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupCorruptedBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find bookings with null or undefined gear
    const corruptedBookings = await RentalBooking.find({
      $or: [
        { gear: null },
        { gear: { $exists: false } }
      ]
    }).populate('renter', 'name email');

    console.log(`Found ${corruptedBookings.length} corrupted bookings\n`);

    if (corruptedBookings.length === 0) {
      console.log('✅ No corrupted bookings found!');
      await mongoose.connection.close();
      return;
    }

    console.log('Corrupted bookings:');
    corruptedBookings.forEach((booking, idx) => {
      console.log(`${idx + 1}. Booking ID: ${booking._id}`);
      console.log(`   Renter: ${booking.renter?.name || 'Unknown'} (${booking.renter?.email || 'Unknown'})`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Gear: ${booking.gear || 'NULL/UNDEFINED'}`);
      console.log('');
    });

    console.log('Deleting corrupted bookings...');
    const result = await RentalBooking.deleteMany({
      $or: [
        { gear: null },
        { gear: { $exists: false } }
      ]
    });

    console.log(`\n✅ Deleted ${result.deletedCount} corrupted bookings`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupCorruptedBookings();
