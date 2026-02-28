const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
require('dotenv').config();

async function seedCommissionSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if commission settings already exist
    const existing = await SiteSettings.findOne({ settingKey: 'platformCommission' });

    if (existing) {
      console.log('Commission settings already exist:');
      console.log(JSON.stringify(existing.settingValue, null, 2));
      
      // Update if needed
      existing.settingValue = {
        enabled: true,
        rate: 10, // 10% commission
        description: 'Platform commission deducted from each completed booking'
      };
      existing.description = 'Platform commission configuration';
      await existing.save();
      console.log('✓ Commission settings updated');
    } else {
      // Create new commission settings
      const commissionSettings = new SiteSettings({
        settingKey: 'platformCommission',
        settingValue: {
          enabled: true,
          rate: 10, // 10% commission
          description: 'Platform commission deducted from each completed booking'
        },
        description: 'Platform commission configuration'
      });

      await commissionSettings.save();
      console.log('✓ Commission settings created');
    }

    console.log('\nCommission System Configuration:');
    console.log('- Enabled: true');
    console.log('- Rate: 10%');
    console.log('- Description: Platform commission deducted from each completed booking');
    console.log('\nHow it works:');
    console.log('1. When a booking is completed, commission is automatically deducted');
    console.log('2. Commission = Booking Total × Commission Rate');
    console.log('3. Example: NPR 1000 booking → NPR 100 commission (10%)');
    console.log('4. Sellers only pay when they earn (no monthly fees)');

    await mongoose.disconnect();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedCommissionSettings();
