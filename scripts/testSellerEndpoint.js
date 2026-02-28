const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const GearRental = require('../models/GearRental');

async function testSellerEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a user with gear
    const users = await User.find().limit(10);
    console.log(`\nFound ${users.length} users`);

    for (const user of users) {
      const gearCount = await GearRental.countDocuments({ owner: user._id });
      if (gearCount > 0) {
        console.log(`\n✓ User: ${user.name} (@${user.username})`);
        console.log(`  - Has ${gearCount} gear item(s)`);
        console.log(`  - Test URL: http://localhost:3000/seller/${user.username}`);
        
        // Fetch gear details
        const gear = await GearRental.find({ owner: user._id })
          .populate('owner', 'name username profilePicture location bio')
          .limit(3);
        
        console.log(`  - Sample gear:`);
        gear.forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.title} - Rs.${item.pricePerDay}/day`);
        });
      }
    }

    console.log('\n✓ Test complete!');
    console.log('\nTo test the seller dashboard:');
    console.log('1. Make sure backend is running on http://localhost:5000');
    console.log('2. Make sure frontend is running on http://localhost:3000');
    console.log('3. Visit one of the URLs listed above');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testSellerEndpoint();
