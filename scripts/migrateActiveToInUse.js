const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const RentalBooking = require('../models/RentalBooking');

async function migrateActiveToInUse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all bookings with 'active' status
    const bookingsWithActive = await RentalBooking.find({ status: 'active' });
    console.log(`Found ${bookingsWithActive.length} bookings with 'active' status`);

    for (const booking of bookingsWithActive) {
      booking.status = 'in_use';
      
      // Update statusHistory if it exists
      if (booking.statusHistory && booking.statusHistory.length > 0) {
        booking.statusHistory = booking.statusHistory.map(entry => {
          if (entry.status === 'active') {
            return {
              ...entry.toObject(),
              status: 'in_use',
              note: entry.note ? entry.note.replace('active', 'in_use') : 'Status changed to in_use'
            };
          }
          return entry;
        });
      }

      await booking.save();
      console.log(`Updated booking ${booking._id}: active -> in_use`);
    }

    // Also check for bookings with 'active' in statusHistory but different current status
    const allBookings = await RentalBooking.find({
      'statusHistory.status': 'active'
    });

    console.log(`\nFound ${allBookings.length} bookings with 'active' in statusHistory`);

    for (const booking of allBookings) {
      if (booking.statusHistory && booking.statusHistory.length > 0) {
        let updated = false;
        booking.statusHistory = booking.statusHistory.map(entry => {
          if (entry.status === 'active') {
            updated = true;
            return {
              ...entry.toObject(),
              status: 'in_use',
              note: entry.note ? entry.note.replace('active', 'in_use') : 'Status changed to in_use'
            };
          }
          return entry;
        });

        if (updated) {
          await booking.save();
          console.log(`Updated statusHistory for booking ${booking._id}`);
        }
      }
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateActiveToInUse();
