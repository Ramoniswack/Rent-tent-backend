const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const GearRental = require('../models/GearRental');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const SiteSettings = require('../models/SiteSettings');
require('dotenv').config();

async function testCommissionDeduction() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get commission settings
    const commissionSetting = await SiteSettings.findOne({ settingKey: 'platformCommission' });
    const commissionRate = commissionSetting?.settingValue?.rate || 10;
    
    console.log('=== Commission Settings ===');
    console.log('Rate:', commissionRate + '%');
    console.log('Enabled:', commissionSetting?.settingValue?.enabled !== false);
    console.log();

    // Find a completed booking
    const completedBooking = await RentalBooking.findOne({ status: 'completed' })
      .populate('gear', 'title')
      .populate('owner', 'name sellerWallet')
      .populate('renter', 'name');

    if (!completedBooking) {
      console.log('No completed bookings found.');
      console.log('Create a booking and mark it as completed to test commission deduction.');
      await mongoose.disconnect();
      return;
    }

    console.log('=== Completed Booking Found ===');
    console.log('Booking ID:', completedBooking._id);
    console.log('Gear:', completedBooking.gear.title);
    console.log('Owner:', completedBooking.owner.name);
    console.log('Renter:', completedBooking.renter.name);
    console.log('Total Price:', 'NPR', completedBooking.totalPrice);
    console.log('Status:', completedBooking.status);
    console.log();

    // Calculate expected commission
    const expectedCommission = Math.round(completedBooking.totalPrice * commissionRate / 100);
    console.log('=== Commission Calculation ===');
    console.log('Booking Amount: NPR', completedBooking.totalPrice);
    console.log('Commission Rate:', commissionRate + '%');
    console.log('Expected Commission: NPR', expectedCommission);
    console.log();

    // Check if commission was already deducted
    const existingTransaction = await WalletTransaction.findOne({
      user: completedBooking.owner._id,
      type: 'deduction',
      'metadata.bookingId': completedBooking._id
    });

    if (existingTransaction) {
      console.log('=== Commission Already Deducted ===');
      console.log('Transaction ID:', existingTransaction._id);
      console.log('Amount Deducted: NPR', existingTransaction.amount);
      console.log('Deducted At:', existingTransaction.createdAt);
      console.log('Balance Before: NPR', existingTransaction.balanceBefore);
      console.log('Balance After: NPR', existingTransaction.balanceAfter);
      console.log();
      console.log('✓ Commission deduction is working correctly!');
    } else {
      console.log('=== Commission Not Yet Deducted ===');
      console.log('This booking was completed but commission was not deducted.');
      console.log('This might happen if:');
      console.log('1. The booking was completed before commission system was implemented');
      console.log('2. There was an error during auto-deduction');
      console.log('3. The booking was manually marked as completed in the database');
      console.log();
      console.log('Current seller wallet balance: NPR', completedBooking.owner.sellerWallet?.credits || 0);
      console.log();
      console.log('To manually deduct commission, run:');
      console.log(`curl -X POST http://localhost:5000/api/wallet/deduct-commission \\`);
      console.log(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"bookingId": "${completedBooking._id}"}'`);
    }

    console.log();
    console.log('=== Recent Wallet Transactions ===');
    const recentTransactions = await WalletTransaction.find({
      user: completedBooking.owner._id
    })
    .sort({ createdAt: -1 })
    .limit(5);

    if (recentTransactions.length === 0) {
      console.log('No transactions found for this seller.');
    } else {
      recentTransactions.forEach((tx, index) => {
        console.log(`\n${index + 1}. ${tx.type.toUpperCase()}`);
        console.log('   Amount: NPR', tx.amount);
        console.log('   Description:', tx.description);
        console.log('   Status:', tx.status);
        console.log('   Date:', tx.createdAt.toLocaleString());
        if (tx.metadata?.commissionRate) {
          console.log('   Commission Rate:', tx.metadata.commissionRate + '%');
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n✓ Test complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCommissionDeduction();
