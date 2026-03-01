const mongoose = require('mongoose');
require('dotenv').config();

const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

async function checkWalletTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all wallet transactions
    const allTransactions = await WalletTransaction.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    console.log(`\nTotal Wallet Transactions: ${allTransactions.length}\n`);

    if (allTransactions.length === 0) {
      console.log('No wallet transactions found in the database.');
      console.log('\nTo create test transactions, users need to:');
      console.log('1. Recharge their wallet via eSewa');
      console.log('2. Complete gear rental bookings (which deduct commission)');
    } else {
      console.log('Recent Transactions:');
      console.log('='.repeat(80));
      
      allTransactions.slice(0, 10).forEach((tx, i) => {
        console.log(`\n${i + 1}. Transaction ID: ${tx._id}`);
        console.log(`   User: ${tx.user?.name || 'Unknown'} (${tx.user?.email || 'N/A'})`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Amount: NPR ${tx.amount}`);
        console.log(`   Balance After: NPR ${tx.balanceAfter}`);
        console.log(`   Date: ${tx.createdAt}`);
        console.log(`   Metadata: ${JSON.stringify(tx.metadata, null, 2)}`);
      });

      // Count by type
      const recharges = allTransactions.filter(tx => tx.type === 'recharge').length;
      const deductions = allTransactions.filter(tx => tx.type === 'deduction').length;
      const refunds = allTransactions.filter(tx => tx.type === 'refund').length;
      
      console.log('\n' + '='.repeat(80));
      console.log(`\nTransaction Summary:`);
      console.log(`  Recharges: ${recharges}`);
      console.log(`  Deductions: ${deductions}`);
      console.log(`  Refunds: ${refunds}`);
      
      // Calculate totals
      const totalRecharges = allTransactions
        .filter(tx => tx.type === 'recharge')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const totalDeductions = allTransactions
        .filter(tx => tx.type === 'deduction')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      console.log(`\nTotal Recharges: NPR ${totalRecharges}`);
      console.log(`Total Deductions: NPR ${totalDeductions}`);
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWalletTransactions();
