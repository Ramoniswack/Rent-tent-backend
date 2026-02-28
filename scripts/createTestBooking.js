require('dotenv').config();
const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');

async function createTestBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first user (renter)
    const renter = await User.findOne();
    if (!renter) {
      console.error('No users found. Please create a user first.');
      process.exit(1);
    }
    console.log('Found renter:', renter.email);

    // Get the first gear item
    const gear = await GearRental.findOne().populate('owner');
    if (!gear) {
      console.error('No gear found. Please create a gear listing first.');
      process.exit(1);
    }
    console.log('Found gear:', gear.title);
    console.log('Gear owner:', gear.owner.email);

    // Check if renter is the same as owner
    if (renter._id.toString() === gear.owner._id.toString()) {
      console.log('⚠️  Renter and owner are the same user. Looking for another user...');
      const anotherUser = await User.findOne({ _id: { $ne: renter._id } });
      if (anotherUser) {
        console.log('Found another user:', anotherUser.email);
        // Use the other user as renter
        const actualRenter = anotherUser;
        
        // Create a completed booking
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 10); // 10 days ago
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 3); // 3 days ago
        const totalDays = 7;

        const booking = await RentalBooking.create({
          gear: gear._id,
          renter: actualRenter._id,
          owner: gear.owner._id,
          startDate,
          endDate,
          totalDays,
          totalPrice: totalDays * gear.pricePerDay,
          deposit: gear.deposit || 0,
          status: 'completed',
          pickupLocation: gear.location,
          notes: 'Test booking for review feature'
        });

        console.log('\n✅ Test booking created successfully!');
        console.log('Booking ID:', booking._id);
        console.log('Gear:', gear.title);
        console.log('Renter:', actualRenter.email);
        console.log('Owner:', gear.owner.email);
        console.log('Status:', booking.status);
        console.log('\n📝 You can now log in as', actualRenter.email, 'and write a review!');
        console.log('Visit: http://localhost:3000/gear/' + gear._id);
      } else {
        console.log('⚠️  Only one user exists. Creating booking anyway (you won\'t be able to review your own gear).');
      }
    } else {
      // Create a completed booking
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10); // 10 days ago
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 3); // 3 days ago
      const totalDays = 7;

      const booking = await RentalBooking.create({
        gear: gear._id,
        renter: renter._id,
        owner: gear.owner._id,
        startDate,
        endDate,
        totalDays,
        totalPrice: totalDays * gear.pricePerDay,
        deposit: gear.deposit || 0,
        status: 'completed',
        pickupLocation: gear.location,
        notes: 'Test booking for review feature'
      });

      console.log('\n✅ Test booking created successfully!');
      console.log('Booking ID:', booking._id);
      console.log('Gear:', gear.title);
      console.log('Renter:', renter.email);
      console.log('Owner:', gear.owner.email);
      console.log('Status:', booking.status);
      console.log('\n📝 You can now log in as', renter.email, 'and write a review!');
      console.log('Visit: http://localhost:3000/gear/' + gear._id);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestBooking();
