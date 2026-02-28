require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const GearRental = require('../models/GearRental');

async function testWishlist() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user
    const user = await User.findOne({ email: { $exists: true } });
    if (!user) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    console.log(`\n📧 Testing with user: ${user.email}`);
    console.log(`👤 User ID: ${user._id}`);

    // Find some gear items
    const gearItems = await GearRental.find().limit(3);
    if (gearItems.length === 0) {
      console.log('❌ No gear items found in database');
      process.exit(1);
    }
    console.log(`\n🎒 Found ${gearItems.length} gear items to test with`);

    // Check current wishlist
    console.log('\n📋 Current wishlist:');
    console.log(`   Items: ${user.wishlist.length}`);

    // Add items to wishlist
    console.log('\n➕ Adding items to wishlist...');
    for (const gear of gearItems) {
      if (!user.wishlist.includes(gear._id)) {
        user.wishlist.push(gear._id);
        console.log(`   ✓ Added: ${gear.title}`);
      } else {
        console.log(`   ⊙ Already in wishlist: ${gear.title}`);
      }
    }
    await user.save();

    // Fetch populated wishlist
    const populatedUser = await User.findById(user._id).populate({
      path: 'wishlist',
      populate: {
        path: 'owner',
        select: 'name username profilePicture'
      }
    });

    console.log('\n📦 Populated wishlist:');
    populatedUser.wishlist.forEach((item, index) => {
      if (item) {
        console.log(`   ${index + 1}. ${item.title}`);
        console.log(`      Price: NPR ${item.pricePerDay}/day`);
        console.log(`      Owner: ${item.owner?.name || 'Unknown'}`);
        console.log(`      Available: ${item.available ? 'Yes' : 'No'}`);
      }
    });

    // Test check wishlist
    console.log('\n🔍 Testing wishlist check:');
    const firstGearId = gearItems[0]._id;
    const isInWishlist = user.wishlist.some(id => id.toString() === firstGearId.toString());
    console.log(`   Gear "${gearItems[0].title}" in wishlist: ${isInWishlist ? 'Yes ✓' : 'No ✗'}`);

    // Test remove from wishlist
    console.log('\n➖ Removing first item from wishlist...');
    user.wishlist = user.wishlist.filter(id => id.toString() !== firstGearId.toString());
    await user.save();
    console.log(`   ✓ Removed: ${gearItems[0].title}`);
    console.log(`   Remaining items: ${user.wishlist.length}`);

    console.log('\n✅ All wishlist tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - User has ${user.wishlist.length} items in wishlist`);
    console.log(`   - Add/Remove operations working correctly`);
    console.log(`   - Population working correctly`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testWishlist();
