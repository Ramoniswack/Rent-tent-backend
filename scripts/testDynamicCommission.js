require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function testDynamicCommission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const SiteSettings = require('../models/SiteSettings');

    // Test 1: Fetch platform commission settings
    console.log('\n📋 Test 1: Fetching platform commission settings...');
    const commissionSettings = await SiteSettings.findOne({ settingKey: 'platformCommission' });
    
    if (commissionSettings) {
      console.log('✅ Commission settings found:');
      console.log('   - Enabled:', commissionSettings.settingValue.enabled);
      console.log('   - Rate:', commissionSettings.settingValue.rate + '%');
      console.log('   - Description:', commissionSettings.settingValue.description);
    } else {
      console.log('❌ No commission settings found');
    }

    // Test 2: Calculate example commission
    if (commissionSettings) {
      console.log('\n💰 Test 2: Example commission calculation:');
      const rate = commissionSettings.settingValue.rate;
      const bookingAmount = 1000;
      const commission = Math.round(bookingAmount * rate / 100);
      console.log(`   - Booking Amount: NPR ${bookingAmount}`);
      console.log(`   - Commission Rate: ${rate}%`);
      console.log(`   - Commission Amount: NPR ${commission}`);
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start backend: cd backend && npm start');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Visit http://localhost:3000/wallet');
    console.log('   4. Check that commission info is displayed dynamically');
    console.log('   5. Visit http://localhost:3000/admin/bookings/settings');
    console.log('   6. Change commission rate and save');
    console.log('   7. Refresh wallet page to see updated commission info');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDynamicCommission();
