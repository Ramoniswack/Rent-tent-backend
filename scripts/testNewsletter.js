require('dotenv').config();
const mongoose = require('mongoose');
const Newsletter = require('../models/Newsletter');
const { sendEmail } = require('../services/emailService');

async function testNewsletter() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'test@example.com';

    // Test 1: Subscribe new email
    console.log('📝 Test 1: Subscribe new email');
    const subscription = await Newsletter.create({
      email: testEmail,
      source: 'footer'
    });
    console.log('✅ Subscription created:', subscription.email);

    // Test 2: Send welcome email
    console.log('\n📧 Test 2: Send welcome email');
    const result = await sendEmail(testEmail, 'newsletterWelcome', { email: testEmail });
    if (result.success) {
      console.log('✅ Welcome email sent successfully');
    } else {
      console.log('❌ Failed to send email:', result.error);
    }

    // Test 3: Try duplicate subscription
    console.log('\n📝 Test 3: Try duplicate subscription');
    try {
      await Newsletter.create({
        email: testEmail,
        source: 'footer'
      });
      console.log('❌ Should have failed with duplicate error');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Duplicate email correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 4: Unsubscribe
    console.log('\n📝 Test 4: Unsubscribe');
    const updated = await Newsletter.findOneAndUpdate(
      { email: testEmail },
      { active: false },
      { new: true }
    );
    console.log('✅ Unsubscribed:', updated.email, '- Active:', updated.active);

    // Test 5: Resubscribe
    console.log('\n📝 Test 5: Resubscribe');
    const resubscribed = await Newsletter.findOneAndUpdate(
      { email: testEmail },
      { active: true, subscribedAt: new Date() },
      { new: true }
    );
    console.log('✅ Resubscribed:', resubscribed.email, '- Active:', resubscribed.active);

    // Test 6: Get stats
    console.log('\n📊 Test 6: Get newsletter stats');
    const totalActive = await Newsletter.countDocuments({ active: true });
    const totalInactive = await Newsletter.countDocuments({ active: false });
    const sourceStats = await Newsletter.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    console.log('✅ Stats:');
    console.log('   - Active subscribers:', totalActive);
    console.log('   - Inactive subscribers:', totalInactive);
    console.log('   - By source:', sourceStats);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Newsletter.deleteOne({ email: testEmail });
    console.log('✅ Test data cleaned up');

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNewsletter();
