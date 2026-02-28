const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const User = require('../models/User');
const GearRental = require('../models/GearRental');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUserBookingsForReview() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('name email username');
    console.log(`Found ${users.length} users\n`);

    // Get all gear
    const allGear = await GearRental.find({}).select('title owner');
    console.log(`Found ${allGear.length} gear items\n`);

    // Get all bookings
    const allBookings = await RentalBooking.find({})
      .populate('gear', 'title')
      .populate('renter', 'name email')
      .populate('owner', 'name email');

    console.log(`Found ${allBookings.length} total bookings\n`);
    console.log('='.repeat(80));

    // Check each user's bookings
    for (const user of users) {
      const userBookings = allBookings.filter(b => 
        b.renter && b.renter._id.toString() === user._id.toString()
      );

      if (userBookings.length === 0) continue;

      console.log(`\n👤 USER: ${user.name} (${user.email})`);
      console.log(`   Total Bookings: ${userBookings.length}`);

      const completed = userBookings.filter(b => b.status === 'completed');
      const withReviews = userBookings.filter(b => b.rating);
      const eligibleForReview = userBookings.filter(b => 
        b.status === 'completed' && !b.rating
      );

      console.log(`   Completed: ${completed.length}`);
      console.log(`   With Reviews: ${withReviews.length}`);
      console.log(`   ✅ Eligible for Review: ${eligibleForReview.length}`);

      if (eligibleForReview.length > 0) {
        console.log('\n   📝 CAN WRITE REVIEWS FOR:');
        eligibleForReview.forEach(booking => {
          console.log(`      - ${booking.gear?.title || 'Unknown Gear'}`);
          console.log(`        Booking ID: ${booking._id}`);
          console.log(`        Gear ID: ${booking.gear?._id}`);
          console.log(`        Status: ${booking.status}`);
          console.log(`        Dates: ${booking.startDate?.toLocaleDateString()} - ${booking.endDate?.toLocaleDateString()}`);
          console.log('');
        });
      }

      // Show all bookings with details
      console.log('\n   📋 ALL BOOKINGS:');
      userBookings.forEach((booking, idx) => {
        console.log(`   ${idx + 1}. ${booking.gear?.title || 'Unknown Gear'}`);
        console.log(`      Status: ${booking.status}`);
        console.log(`      Has Review: ${booking.rating ? 'Yes (' + booking.rating + ' stars)' : 'No'}`);
        console.log(`      Booking ID: ${booking._id}`);
        console.log(`      Gear ID: ${booking.gear?._id}`);
        console.log('');
      });

      console.log('-'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));

    const totalCompleted = allBookings.filter(b => b.status === 'completed').length;
    const totalWithReviews = allBookings.filter(b => b.rating).length;
    const totalEligible = allBookings.filter(b => b.status === 'completed' && !b.rating).length;

    console.log(`Total Completed Bookings: ${totalCompleted}`);
    console.log(`Total With Reviews: ${totalWithReviews}`);
    console.log(`Total Eligible for Review: ${totalEligible}`);

    if (totalEligible === 0) {
      console.log('\n⚠️  NO BOOKINGS ARE ELIGIBLE FOR REVIEW!');
      console.log('\nTo make a booking eligible:');
      console.log('1. It must have status: "completed"');
      console.log('2. It must NOT have a rating field');
      console.log('\nRun this command to make a booking eligible:');
      console.log('node backend/scripts/makeBookingEligibleForReview.js <BOOKING_ID>');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserBookingsForReview();
