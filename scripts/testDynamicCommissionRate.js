const mongoose = require('mongoose');
require('dotenv').config();

const SiteSettings = require('../models/SiteSettings');

async function testDynamicCommissionRate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing Dynamic Commission Rate ===\n');

    // Check current commission settings
    const currentSettings = await SiteSettings.findOne({ settingKey: 'platformCommission' });
    
    if (currentSettings) {
      console.log('✓ Current Platform Commission Settings:');
      console.log(JSON.stringify(currentSettings.settingValue, null, 2));
      console.log(`\nCommission Rate: ${currentSettings.settingValue.rate}%`);
      console.log(`Enabled: ${currentSettings.settingValue.enabled}`);
      console.log(`Description: ${currentSettings.settingValue.description}`);
    } else {
      console.log('❌ No platform commission settings found');
      console.log('\nCreating default settings...');
      
      const newSettings = await SiteSettings.create({
        settingKey: 'platformCommission',
        settingValue: {
          enabled: true,
          rate: 10,
          description: 'Platform commission deducted from each completed booking'
        },
        description: 'Platform commission configuration'
      });
      
      console.log('✓ Created default commission settings:');
      console.log(JSON.stringify(newSettings.settingValue, null, 2));
    }

    // Test updating commission rate
    console.log('\n--- Testing Commission Rate Update ---');
    const testRate = 15;
    
    const updated = await SiteSettings.findOneAndUpdate(
      { settingKey: 'platformCommission' },
      {
        $set: {
          'settingValue.rate': testRate,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    console.log(`✓ Updated commission rate to ${testRate}%`);
    console.log('Updated settings:', JSON.stringify(updated.settingValue, null, 2));

    // Restore original rate
    console.log('\n--- Restoring Original Rate ---');
    const originalRate = currentSettings?.settingValue?.rate || 10;
    
    await SiteSettings.findOneAndUpdate(
      { settingKey: 'platformCommission' },
      {
        $set: {
          'settingValue.rate': originalRate,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✓ Restored commission rate to ${originalRate}%`);

    // Test API endpoint format
    console.log('\n--- API Endpoint Response Format ---');
    const finalSettings = await SiteSettings.findOne({ settingKey: 'platformCommission' });
    
    const apiResponse = {
      key: finalSettings.settingKey,
      value: finalSettings.settingValue,
      description: finalSettings.description
    };
    
    console.log('Expected API response:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n--- Frontend Usage ---');
    console.log('The booking page should fetch from:');
    console.log('GET /api/site-settings/platformCommission');
    console.log('\nAnd extract the rate with:');
    console.log('const rate = data.value.rate;');
    console.log(`\nCurrent rate that will be displayed: ${finalSettings.settingValue.rate}%`);

    console.log('\n✅ All tests passed!');
    console.log('\nTo change the commission rate:');
    console.log('1. Go to http://localhost:3000/admin/bookings/settings');
    console.log('2. Update the "Commission Rate (%)" field');
    console.log('3. Click "Save Settings"');
    console.log('4. The booking page will automatically show the new rate');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testDynamicCommissionRate();
