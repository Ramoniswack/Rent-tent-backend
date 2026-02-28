const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function makeBookingEligible() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const bookingId = process.argv[2];

    if (!bookingId) {
      console.log('Usage: node makeBookingEligibleForReview.js <BOOKING_ID>');
      console.log('\nOr to make ALL bookings eligible:');
      console.log('node makeBookingEligibleForReview.js ALL');
      process.exit(1);
    }

    if (bookingId === 'ALL') {
      // Make all bookings eligible
      const result = await RentalBooking.updateMany(
        {},
        { 
          $set: { status: 'completed' },
          $unset: { rating: '', review: '' }
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} bookings`);
      console.log('All bookings are now:');
      console.log('  - Status: completed');
      console.log('  - Rating: removed');
      console.log('  - Review: removed');
    } else {
      // Make specific booking eligible
      const booking = await RentalBooking.findById(bookingId)
        .populate('gear', 'title')
        .populate('renter', 'name email');

      if (!booking) {
        console.log('❌ Booking not found');
        process.exit(1);
      }

      console.log('Found booking:');
      console.log(`  Gear: ${booking.gear?.title}`);
      console.log(`  Renter: ${booking.renter?.name} (${booking.renter?.email})`);
      console.log(`  Current Status: ${booking.status}`);
      console.log(`  Has Review: ${booking.rating ? 'Yes' : 'No'}`);

      // Update booking
      booking.status = 'completed';
      booking.rating = undefined;
      booking.review = undefined;
      await booking.save();

      console.log('\n✅ Booking updated!');
      console.log('  Status: completed');
      console.log('  Rating: removed');
      console.log('  Review: removed');
      console.log('\nThis booking is now eligible for review!');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeBookingEligible();
