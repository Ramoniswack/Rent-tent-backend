require('dotenv').config();
const mongoose = require('mongoose');
const ProfileFieldOptions = require('../models/ProfileFieldOptions');

async function testFooterMenus() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check existing footer menus
    console.log('📋 Checking existing footer menus...');
    const productMenu = await ProfileFieldOptions.findOne({ fieldType: 'footerProductMenu' });
    const companyMenu = await ProfileFieldOptions.findOne({ fieldType: 'footerCompanyMenu' });

    console.log('\n📦 Product Menu:');
    if (productMenu) {
      console.log('   Found:', productMenu.menuItems);
    } else {
      console.log('   Not found - creating default...');
      await ProfileFieldOptions.create({
        fieldType: 'footerProductMenu',
        menuItems: [
          { label: 'Browse Gear', url: '/gear' },
          { label: 'Rent Equipment', url: '/gear' },
          { label: 'List Your Gear', url: '/gear/add' }
        ]
      });
      console.log('   ✅ Created default product menu');
    }

    console.log('\n🏢 Company Menu:');
    if (companyMenu) {
      console.log('   Found:', companyMenu.menuItems);
    } else {
      console.log('   Not found - creating default...');
      await ProfileFieldOptions.create({
        fieldType: 'footerCompanyMenu',
        menuItems: [
          { label: 'About Us', url: '/about' },
          { label: 'Contact', url: '/contact' },
          { label: 'Help Center', url: '/help' }
        ]
      });
      console.log('   ✅ Created default company menu');
    }

    // Test API endpoint
    console.log('\n🧪 Testing API endpoint...');
    const allOptions = await ProfileFieldOptions.find({ 
      fieldType: { $in: ['footerProductMenu', 'footerCompanyMenu'] } 
    });
    
    const result = {};
    allOptions.forEach(option => {
      result[option.fieldType] = option.menuItems || [];
    });
    
    console.log('   API Response format:', JSON.stringify(result, null, 2));

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFooterMenus();
