const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
require('dotenv').config();

async function seedBookingTexts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const bookingTexts = {
      pickupInstructions: 'Please arrive 15 minutes before your scheduled pickup time. Bring a valid ID and payment confirmation. Inspect the gear thoroughly before taking it.',
      returnInstructions: 'Return the item in the same condition as received. Clean the gear before return. Check all accessories are included. Late returns will incur additional fees.',
      termsAndPolicies: 'By booking this item, you agree to our terms of service and rental policies. You are responsible for the gear during the rental period.',
      lateReturnPolicy: 'Late returns are subject to a penalty fee per day as specified in your booking. Please contact the owner if you need an extension.',
      protectionPlanActive: 'Full coverage for damage, theft, and loss during the rental period. Your security deposit is protected.',
      protectionPlanInactive: 'No protection coverage for this rental. You are responsible for any damage or loss. Security deposit may be used for repairs.',
      cancellationPolicy: 'Free cancellation until the deadline specified in your booking. Cancellation fee applies after the deadline.',
      cancellationFeeNote: 'Cancellation fee is calculated as a percentage of the total booking amount based on how close to the rental date you cancel.'
    };

    const result = await SiteSettings.findOneAndUpdate(
      { settingKey: 'bookingTexts' },
      {
        settingKey: 'bookingTexts',
        settingValue: bookingTexts,
        description: 'Dynamic text content for booking pages'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Booking texts seeded successfully!');
    console.log('Setting ID:', result._id);
    console.log('\nYou can now customize these texts from the admin panel at:');
    console.log('http://localhost:3000/admin/bookings/settings');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding booking texts:', error);
    process.exit(1);
  }
}

seedBookingTexts();
