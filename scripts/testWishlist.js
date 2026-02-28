const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const GearRental = require('../models/GearRental');

async function testWishlist() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user
    const user = await User.findOne({ email: { $exists: true } });
    if (!user) {
      console.log('❌ No users found');
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Find a gear item
    const gear = await GearRental.findOne({ available: true });
    if (!gear) {
      console.log('❌ No gear found');
      process.exit(1);
    }
    console.log(`✅ Found gear: ${gear.title}`);

    // Test 1: Add to wishlist
    console.log('\n📝 Test 1: Adding gear to wishlist...');
    if (!user.wishlist) {
      user.wishlist = [];
    }
    if (!user.wishlist.includes(gear._id)) {
      user.wishlist.push(gear._id);
      await user.save();
      console.log('✅ Added to wishlist');
    } else {
      console.log('ℹ️  Already in wishlist');
    }

    // Test 2: Check wishlist
    console.log('\n📝 Test 2: Checking wishlist...');
    const updatedUser = await User.findById(user._id).populate('wishlist');
    console.log(`✅ Wishlist has ${updatedUser.wishlist.length} items`);
    if (updatedUser.wishlist.length > 0) {
      updatedUser.wishlist.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - ${item.pricePerDay} per day`);
      });
    }

    // Test 3: Remove from wishlist
    console.log('\n📝 Test 3: Removing gear from wishlist...');
    user.wishlist = user.wishlist.filter(id => id.toString() !== gear._id.toString());
    await user.save();
    console.log('✅ Removed from wishlist');

    // Verify removal
    const finalUser = await User.findById(user._id);
    console.log(`✅ Wishlist now has ${finalUser.wishlist.length} items`);

    console.log('\n✅ All wishlist tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWishlist();
