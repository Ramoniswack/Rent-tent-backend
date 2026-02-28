require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const GearRental = require('../models/GearRental');

async function checkWalletBalances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const MIN_WALLET_BALANCE = 100;

    // Find all users with gear listings
    const usersWithGear = await User.find({
      'sellerWallet.credits': { $exists: true }
    }).select('_id name sellerWallet');

    console.log(`\n📊 Checking ${usersWithGear.length} users with seller wallets...`);

    let totalGearChecked = 0;
    let totalGearDeactivated = 0;
    let totalGearActive = 0;

    for (const user of usersWithGear) {
      const walletBalance = user.sellerWallet?.credits || 0;
      
      // Find all gear owned by this user
      const userGear = await GearRental.find({ owner: user._id });
      totalGearChecked += userGear.length;

      if (walletBalance < MIN_WALLET_BALANCE) {
        // Deactivate all available gear
        const result = await GearRental.updateMany(
          { owner: user._id, available: true },
          { $set: { available: false } }
        );

        if (result.modifiedCount > 0) {
          console.log(`\n❌ User: ${user.name}`);
          console.log(`   Balance: NPR ${walletBalance}`);
          console.log(`   Deactivated: ${result.modifiedCount} gear items`);
          totalGearDeactivated += result.modifiedCount;
        }
      } else {
        const activeGear = userGear.filter(g => g.available).length;
        if (activeGear > 0) {
          totalGearActive += activeGear;
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Total gear checked: ${totalGearChecked}`);
    console.log(`   Active gear (sufficient balance): ${totalGearActive}`);
    console.log(`   Deactivated gear (insufficient balance): ${totalGearDeactivated}`);

    console.log('\n✅ Wallet balance check completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkWalletBalances();
