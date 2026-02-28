const mongoose = require('mongoose');
require('dotenv').config();

const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');

async function testMultiplePendingBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a gear item
    const gear = await GearRental.findOne({ available: true });
    if (!gear) {
      console.log('No available gear found');
      return;
    }

    console.log('\n=== Testing Multiple Pending Bookings ===');
    console.log(`Gear: ${gear.name} (${gear._id})`);
    console.log(`Owner: ${gear.owner}`);

    // Find two different users (not the owner)
    const users = await User.find({ 
      _id: { $ne: gear.owner } 
    }).limit(2);

    if (users.length < 2) {
      console.log('Need at least 2 users to test');
      return;
    }

    const testStartDate = new Date();
    testStartDate.setDate(testStartDate.getDate() + 5);
    const testEndDate = new Date(testStartDate);
    testEndDate.setDate(testEndDate.getDate() + 3);

    console.log(`\nTest dates: ${testStartDate.toDateString()} to ${testEndDate.toDateString()}`);

    // Check existing bookings for these dates
    const existingBookings = await RentalBooking.find({
      gear: gear._id,
      startDate: { $lte: testEndDate },
      endDate: { $gte: testStartDate }
    });

    console.log(`\nExisting bookings for these dates: ${existingBookings.length}`);
    existingBookings.forEach(booking => {
      console.log(`  - Status: ${booking.status}, Renter: ${booking.renter}`);
    });

    // Create first pending booking
    console.log(`\n--- Creating first pending booking ---`);
    const booking1 = await RentalBooking.create({
      gear: gear._id,
      renter: users[0]._id,
      owner: gear.owner,
      startDate: testStartDate,
      endDate: testEndDate,
      totalDays: 3,
      totalPrice: gear.pricePerDay * 3,
      deposit: gear.deposit,
      pickupLocation: 'Test Location 1',
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Test booking 1'
      }]
    });
    console.log(`✓ First booking created: ${booking1._id}`);
    console.log(`  Renter: ${users[0].username || users[0].email}`);

    // Try to create second pending booking for same dates
    console.log(`\n--- Creating second pending booking (same dates) ---`);
    try {
      const booking2 = await RentalBooking.create({
        gear: gear._id,
        renter: users[1]._id,
        owner: gear.owner,
        startDate: testStartDate,
        endDate: testEndDate,
        totalDays: 3,
        totalPrice: gear.pricePerDay * 3,
        deposit: gear.deposit,
        pickupLocation: 'Test Location 2',
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          note: 'Test booking 2'
        }]
      });
      console.log(`✓ Second booking created: ${booking2._id}`);
      console.log(`  Renter: ${users[1].username || users[1].email}`);
      console.log('\n✅ SUCCESS: Multiple pending bookings allowed for same dates!');
    } catch (error) {
      console.log(`❌ FAILED: Could not create second booking`);
      console.log(`Error: ${error.message}`);
    }

    // Now confirm the first booking
    console.log(`\n--- Confirming first booking ---`);
    booking1.status = 'confirmed';
    booking1.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Owner confirmed'
    });
    await booking1.save();
    console.log(`✓ First booking confirmed`);

    // Try to create third pending booking (should fail now)
    console.log(`\n--- Trying to create third booking (should fail) ---`);
    try {
      const booking3 = await RentalBooking.create({
        gear: gear._id,
        renter: users[0]._id,
        owner: gear.owner,
        startDate: testStartDate,
        endDate: testEndDate,
        totalDays: 3,
        totalPrice: gear.pricePerDay * 3,
        deposit: gear.deposit,
        pickupLocation: 'Test Location 3',
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          note: 'Test booking 3'
        }]
      });
      console.log(`❌ UNEXPECTED: Third booking was created (should have been blocked)`);
    } catch (error) {
      console.log(`✅ EXPECTED: Third booking blocked because first is confirmed`);
    }

    // Cleanup test bookings
    console.log(`\n--- Cleaning up test bookings ---`);
    const deleted = await RentalBooking.deleteMany({
      _id: { $in: [booking1._id] },
      notes: { $regex: /Test booking/ }
    });
    console.log(`Deleted ${deleted.deletedCount} test bookings`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testMultiplePendingBookings();
