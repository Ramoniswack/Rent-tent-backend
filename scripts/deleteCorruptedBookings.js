const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function deleteCorruptedBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all bookings
    const bookings = await RentalBooking.find({})
      .populate('gear', 'title')
      .populate('renter', 'name email');

    console.log(`Found ${bookings.length} total bookings\n`);

    // Find corrupted ones (gear is null or doesn't populate)
    const corruptedIds = [];
    
    bookings.forEach((booking) => {
      if (!booking.gear || !booking.gear._id) {
        corruptedIds.push(booking._id);
        console.log(`Found corrupted booking: ${booking._id}`);
        console.log(`  Renter: ${booking.renter?.name || 'Unknown'}`);
        console.log(`  Status: ${booking.status}`);
        console.log('');
      }
    });

    if (corruptedIds.length === 0) {
      console.log('✅ No corrupted bookings found!');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${corruptedIds.length} corrupted bookings`);
    console.log('Deleting...\n');

    const result = await RentalBooking.deleteMany({
      _id: { $in: corruptedIds }
    });

    console.log(`✅ Deleted ${result.deletedCount} corrupted bookings`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteCorruptedBookings();
