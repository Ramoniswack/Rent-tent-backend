const mongoose = require('mongoose');
require('dotenv').config();

const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');

async function testBookingOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a sample booking
    const booking = await RentalBooking.findOne()
      .populate({
        path: 'gear',
        populate: {
          path: 'owner',
          select: 'name email username'
        }
      })
      .populate('owner', 'name email username')
      .populate('renter', 'name email username');

    if (!booking) {
      console.log('No bookings found in database');
      process.exit(0);
    }

    console.log('\n=== BOOKING DATA STRUCTURE ===');
    console.log('Booking ID:', booking._id);
    console.log('\nBooking Owner (booking.owner):');
    console.log('  ID:', booking.owner._id);
    console.log('  Name:', booking.owner.name);
    console.log('  Username:', booking.owner.username);

    console.log('\nRenter (booking.renter):');
    console.log('  ID:', booking.renter._id);
    console.log('  Name:', booking.renter.name);
    console.log('  Username:', booking.renter.username);

    console.log('\nGear (booking.gear):');
    console.log('  ID:', booking.gear._id);
    console.log('  Title:', booking.gear.title);
    console.log('  Owner ID (gear.owner._id):', booking.gear.owner._id);
    console.log('  Owner Name:', booking.gear.owner.name);
    console.log('  Owner Username:', booking.gear.owner.username);

    console.log('\n=== OWNERSHIP CHECKS ===');
    console.log('booking.owner === gear.owner?', 
      booking.owner._id.toString() === booking.gear.owner._id.toString());
    
    console.log('\n=== FRONTEND LOGIC ===');
    console.log('For user to see Owner Controls, they must be:');
    console.log('  booking.gear.owner._id === user._id');
    console.log('  OR booking.owner._id === user._id');
    
    console.log('\nGear Owner ID:', booking.gear.owner._id.toString());
    console.log('Booking Owner ID:', booking.owner._id.toString());

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBookingOwnership();
