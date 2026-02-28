require('dotenv').config();
const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');

async function testUnavailableDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a gear item
    const gear = await GearRental.findOne();
    if (!gear) {
      console.log('No gear found in database');
      return;
    }

    console.log('\n=== Testing Gear ===');
    console.log('Gear ID:', gear._id);
    console.log('Gear Title:', gear.title);

    // Find all bookings for this gear
    const allBookings = await RentalBooking.find({ gear: gear._id });
    console.log('\n=== All Bookings ===');
    console.log('Total bookings:', allBookings.length);
    allBookings.forEach(booking => {
      console.log(`- Status: ${booking.status}, Start: ${booking.startDate}, End: ${booking.endDate}`);
    });

    // Find non-cancelled/non-completed bookings (what the API should return)
    const activeBookings = await RentalBooking.find({
      gear: gear._id,
      status: { $nin: ['cancelled', 'completed'] }
    }).select('startDate endDate status');

    console.log('\n=== Active Bookings (API Response) ===');
    console.log('Active bookings count:', activeBookings.length);
    activeBookings.forEach(booking => {
      console.log(`- Status: ${booking.status}, Start: ${booking.startDate}, End: ${booking.endDate}`);
    });

    // Format as API would return
    const unavailableDates = activeBookings.map(booking => ({
      startDate: booking.startDate,
      endDate: booking.endDate,
      type: 'booked'
    }));

    console.log('\n=== Formatted API Response ===');
    console.log(JSON.stringify(unavailableDates, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUnavailableDates();
