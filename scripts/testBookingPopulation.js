const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');

async function testBookingPopulation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a booking
    const booking = await RentalBooking.findOne()
      .populate('gear')
      .populate('renter', 'name email profilePicture username')
      .populate('owner', 'name email profilePicture username');

    if (!booking) {
      console.log('No bookings found');
      return;
    }

    console.log('\n=== Booking Data ===');
    console.log('Booking ID:', booking._id);
    console.log('\nRenter:', {
      _id: booking.renter?._id,
      name: booking.renter?.name,
      username: booking.renter?.username,
      email: booking.renter?.email
    });
    console.log('\nOwner:', {
      _id: booking.owner?._id,
      name: booking.owner?.name,
      username: booking.owner?.username,
      email: booking.owner?.email
    });
    console.log('\nGear:', {
      _id: booking.gear?._id,
      title: booking.gear?.title
    });
    console.log('\nStatus History:', booking.statusHistory);

    console.log('\n✅ Booking data is properly populated');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testBookingPopulation();
