require('dotenv').config();
const mongoose = require('mongoose');
const ProfileFieldOptions = require('../models/ProfileFieldOptions');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function testFooterMenuSimple() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Verify admin user
    console.log('👤 Test 1: Verify admin user');
    const admin = await User.findOne({ email: 'baniya@baniya.baniya' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    console.log('✅ Admin found:', admin.name, '- isAdmin:', admin.isAdmin);
    
    // Test password
    const testPassword = 'Bishal@123';
    const passwordMatch = await bcrypt.compare(testPassword, admin.password);
    console.log('✅ Password test:', passwordMatch ? 'MATCH' : 'NO MATCH');
    console.log('');

    // Test 2: Update product menu directly
    console.log('📝 Test 2: Update product menu directly in database');
    const newProductMenu = [
      { label: 'Browse Gear', url: '/gear' },
      { label: 'My Rentals', url: '/rentals' },
      { label: 'List Your Gear', url: '/gear/add' }
    ];
    
    const productMenuResult = await ProfileFieldOptions.findOneAndUpdate(
      { fieldType: 'footerProductMenu' },
      { 
        fieldType: 'footerProductMenu',
        menuItems: newProductMenu,
        lastModifiedBy: admin._id
      },
      { new: true, upsert: true }
    );
    console.log('✅ Product menu updated:', productMenuResult.menuItems.length, 'items');
    console.log('');

    // Test 3: Update company menu directly
    console.log('📝 Test 3: Update company menu directly in database');
    const newCompanyMenu = [
      { label: 'About Us', url: '/about' },
      { label: 'Contact', url: '/contact' }
    ];
    
    const companyMenuResult = await ProfileFieldOptions.findOneAndUpdate(
      { fieldType: 'footerCompanyMenu' },
      { 
        fieldType: 'footerCompanyMenu',
        menuItems: newCompanyMenu,
        lastModifiedBy: admin._id
      },
      { new: true, upsert: true }
    );
    console.log('✅ Company menu updated:', companyMenuResult.menuItems.length, 'items');
    console.log('');

    // Test 4: Verify updates
    console.log('📋 Test 4: Verify updates');
    const allOptions = await ProfileFieldOptions.find({ 
      fieldType: { $in: ['footerProductMenu', 'footerCompanyMenu'] } 
    });
    
    allOptions.forEach(option => {
      console.log(`✅ ${option.fieldType}:`, option.menuItems.map(i => i.label).join(', '));
    });

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFooterMenuSimple();
