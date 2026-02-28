const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const RentalBooking = require('../models/RentalBooking');

async function addStatusHistoryToBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all bookings without statusHistory
    const bookings = await RentalBooking.find({
      $or: [
        { statusHistory: { $exists: false } },
        { statusHistory: { $size: 0 } }
      ]
    });

    console.log(`Found ${bookings.length} bookings without status history`);

    for (const booking of bookings) {
      // Initialize statusHistory with current status
      booking.statusHistory = [{
        status: booking.status === 'active' ? 'in_use' : booking.status,
        timestamp: booking.createdAt || new Date(),
        note: 'Initial status (migrated)'
      }];

      await booking.save();
      console.log(`Updated booking ${booking._id}`);
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addStatusHistoryToBookings();
