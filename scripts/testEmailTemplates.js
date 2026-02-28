require('dotenv').config();
const { sendEmail } = require('../services/emailService');

async function testAllEmailTemplates() {
  console.log('Testing All Email Templates...\n');

  const testEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;

  // Test data
  const testUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    username: 'testuser',
    email: testEmail,
    bio: 'Adventure seeker and travel enthusiast'
  };

  const testGear = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Professional Hiking Backpack',
    location: 'Kathmandu, Nepal',
    pricePerDay: 500,
    images: ['https://example.com/backpack.jpg']
  };

  const testBooking = {
    _id: '507f1f77bcf86cd799439013',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    totalPrice: 3500,
    totalDays: 7
  };

  const testOwner = {
    _id: '507f1f77bcf86cd799439014',
    name: 'Gear Owner',
    username: 'gearowner',
    email: testEmail
  };

  const testMatchedUser = {
    _id: '507f1f77bcf86cd799439015',
    name: 'Travel Buddy',
    username: 'travelbuddy',
    email: testEmail,
    profilePicture: 'https://ui-avatars.com/api/?name=Travel+Buddy&background=059467&color=fff&size=200',
    bio: 'Love exploring new places and meeting fellow adventurers!'
  };

  try {
    // Test 1: Welcome Email
    console.log('1. Testing Welcome Email...');
    const welcomeResult = await sendEmail(testEmail, 'welcome', testUser);
    console.log(welcomeResult.success ? '✅ Welcome email sent' : '❌ Failed');
    console.log('');

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: New Order Email
    console.log('2. Testing New Order Email...');
    const newOrderResult = await sendEmail(testEmail, 'newOrder', {
      booking: testBooking,
      gear: testGear,
      renter: testUser
    });
    console.log(newOrderResult.success ? '✅ New order email sent' : '❌ Failed');
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Order Confirmed Email
    console.log('3. Testing Order Confirmed Email...');
    const confirmedResult = await sendEmail(testEmail, 'orderConfirmed', {
      booking: testBooking,
      gear: testGear,
      owner: testOwner
    });
    console.log(confirmedResult.success ? '✅ Order confirmed email sent' : '❌ Failed');
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: New Match Email
    console.log('4. Testing New Match Email...');
    const matchResult = await sendEmail(testEmail, 'newMatch', {
      currentUser: testUser,
      matchedUser: testMatchedUser
    });
    console.log(matchResult.success ? '✅ New match email sent' : '❌ Failed');
    console.log('');

    console.log('========================================');
    console.log('All email templates tested!');
    console.log(`Check your inbox at: ${testEmail}`);
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error testing emails:', error.message);
  }
}

testAllEmailTemplates();
