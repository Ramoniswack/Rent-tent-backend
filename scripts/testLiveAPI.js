const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testLiveAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get both users
    const bishal = await User.findOne({ username: 'mrbishalbaniya' });
    const smita = await User.findOne({ username: 'sush1' });

    if (!bishal || !smita) {
      console.log('❌ Users not found');
      process.exit(1);
    }

    console.log('=== User Details ===\n');
    console.log('1. Bishal Baniya (@mrbishalbaniya)');
    console.log(`   Email: ${bishal.email}`);
    console.log(`   ID: ${bishal._id}`);
    console.log('');
    console.log('2. Smita Kunwar (@sush1)');
    console.log(`   Email: ${smita.email}`);
    console.log(`   ID: ${smita._id}`);
    console.log('');

    // Generate tokens for testing
    const bishalToken = jwt.sign(
      { userId: bishal._id.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const smitaToken = jwt.sign(
      { userId: smita._id.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('=== Test API Calls ===\n');
    console.log('To test as Bishal Baniya, use this curl command:\n');
    console.log(`curl -H "Authorization: Bearer ${bishalToken}" http://localhost:5000/api/messages/matches`);
    console.log('\n');
    console.log('To test as Smita Kunwar, use this curl command:\n');
    console.log(`curl -H "Authorization: Bearer ${smitaToken}" http://localhost:5000/api/messages/matches`);
    console.log('\n');

    console.log('=== Frontend Testing ===\n');
    console.log('1. Login as Bishal:');
    console.log(`   Email: ${bishal.email}`);
    console.log('   Go to: http://localhost:3000/messages');
    console.log('   Expected: Should see Smita Kunwar (@sush1) in list');
    console.log('');
    console.log('2. Login as Smita:');
    console.log(`   Email: ${smita.email}`);
    console.log('   Go to: http://localhost:3000/messages');
    console.log('   Expected: Should see Bishal Baniya (@mrbishalbaniya) in list');
    console.log('');

    console.log('=== Troubleshooting Steps ===\n');
    console.log('If still not showing:');
    console.log('1. Check browser console (F12) for errors');
    console.log('2. Check Network tab to see API response');
    console.log('3. Verify token is being sent in Authorization header');
    console.log('4. Hard refresh page (Ctrl+Shift+R)');
    console.log('5. Clear localStorage and login again');
    console.log('6. Check backend logs for any errors');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testLiveAPI();
