const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkAllBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const bookings = await RentalBooking.find({})
      .populate('gear', 'title')
      .populate('renter', 'name email')
      .populate('owner', 'name email');

    console.log(`Found ${bookings.length} total bookings\n`);

    let corruptedCount = 0;

    bookings.forEach((booking, idx) => {
      const isCorrupted = !booking.gear || !booking.gear._id;
      
      if (isCorrupted) {
        corruptedCount++;
        console.log(`❌ CORRUPTED BOOKING ${corruptedCount}:`);
      } else {
        console.log(`✅ Booking ${idx + 1}:`);
      }
      
      console.log(`   ID: ${booking._id}`);
      console.log(`   Gear: ${booking.gear?.title || 'NULL/MISSING'}`);
      console.log(`   Gear ID: ${booking.gear?._id || 'NULL/MISSING'}`);
      console.log(`   Renter: ${booking.renter?.name || 'Unknown'}`);
      console.log(`   Status: ${booking.status}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log(`Total Bookings: ${bookings.length}`);
    console.log(`Corrupted Bookings: ${corruptedCount}`);
    console.log(`Valid Bookings: ${bookings.length - corruptedCount}`);

    if (corruptedCount > 0) {
      console.log('\n⚠️  Found corrupted bookings!');
      console.log('Run this to delete them:');
      console.log('node backend/scripts/deleteCorruptedBookings.js');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllBookings();
