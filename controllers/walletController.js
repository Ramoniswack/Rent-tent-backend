const User = require('../models/User');
const GearRental = require('../models/GearRental');
const WalletTransaction = require('../models/WalletTransaction');
const RentalBooking = require('../models/RentalBooking');
const SiteSettings = require('../models/SiteSettings');
const esewaService = require('../services/esewaService');

// Default commission rate (can be overridden by site settings)
const DEFAULT_COMMISSION_RATE = 10; // 10%
const FREE_TRIAL_CREDITS = 500; // NPR for new sellers

// GET /api/wallet - Get seller wallet balance
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('sellerWallet sellerSubscription');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize wallet if not exists
    if (!user.sellerWallet) {
      user.sellerWallet = {
        credits: FREE_TRIAL_CREDITS,
        totalRecharged: 0,
        totalSpent: 0
      };
      await user.save();
    }

    // Get commission rate from settings
    const commissionSetting = await SiteSettings.findOne({ settingKey: 'platformCommission' });
    const commissionRate = commissionSetting?.settingValue?.rate || DEFAULT_COMMISSION_RATE;

    // Get active gear count
    const activeGearCount = await GearRental.countDocuments({
      owner: req.userId,
      available: true
    });

    // Get pending bookings (commission will be deducted when completed)
    const pendingBookings = await RentalBooking.find({
      owner: req.userId,
      status: { $in: ['pending', 'confirmed', 'active', 'picked_up', 'in_use', 'returned', 'inspected'] }
    }).select('totalPrice');

    const pendingCommission = pendingBookings.reduce((sum, booking) => {
      return sum + (booking.totalPrice * commissionRate / 100);
    }, 0);

    res.json({
      wallet: user.sellerWallet,
      subscription: user.sellerSubscription,
      activeGearCount,
      commissionRate,
      pendingCommission: Math.round(pendingCommission),
      commissionEnabled: commissionSetting?.settingValue?.enabled !== false
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
};

// POST /api/wallet/esewa/initiate - Initiate eSewa payment
exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid recharge amount' });
    }

    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum recharge amount is NPR 100' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate unique transaction UUID
    const transactionUuid = esewaService.generateTransactionUuid(req.userId);

    // Create transaction record
    const balanceBefore = user.sellerWallet?.credits || 0;
    
    const transaction = new WalletTransaction({
      user: req.userId,
      type: 'recharge',
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: balanceBefore, // Will be updated after payment
      description: `Wallet recharge via eSewa - NPR ${amount}`,
      paymentMethod: 'esewa',
      esewaDetails: {
        transactionUuid: transactionUuid,
        status: 'PENDING',
        totalAmount: amount
      },
      status: 'pending'
    });

    await transaction.save();

    // Create eSewa payment parameters
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const paymentParams = esewaService.createPaymentParams({
      amount: amount,
      taxAmount: 0,
      serviceCharge: 0,
      deliveryCharge: 0,
      transactionUuid: transactionUuid,
      successUrl: `${baseUrl}/wallet/payment/success`,
      failureUrl: `${baseUrl}/wallet/payment/failure`
    });

    res.json({
      success: true,
      transactionUuid: transactionUuid,
      paymentUrl: esewaService.ESEWA_CONFIG.paymentUrl,
      paymentParams: paymentParams
    });
  } catch (error) {
    console.error('Initiate eSewa payment error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

// POST /api/wallet/esewa/verify - Verify eSewa payment
exports.verifyEsewaPayment = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Payment data is required' });
    }

    // Decode base64 response
    let paymentResponse;
    try {
      const decodedData = Buffer.from(data, 'base64').toString('utf-8');
      paymentResponse = JSON.parse(decodedData);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid payment data format' });
    }

    // Verify signature
    const isValid = esewaService.verifyPaymentResponse(paymentResponse);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Find transaction
    const transaction = await WalletTransaction.findOne({
      'esewaDetails.transactionUuid': paymentResponse.transaction_uuid
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if already processed
    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        transaction: transaction
      });
    }

    // Verify with eSewa API
    const statusCheck = await esewaService.checkPaymentStatus(
      paymentResponse.transaction_uuid,
      paymentResponse.total_amount
    );

    if (statusCheck.status !== 'COMPLETE') {
      transaction.status = 'failed';
      transaction.esewaDetails.status = statusCheck.status;
      await transaction.save();

      return res.status(400).json({ 
        error: 'Payment verification failed',
        status: statusCheck.status
      });
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.esewaDetails.transactionCode = paymentResponse.transaction_code;
    transaction.esewaDetails.refId = statusCheck.ref_id;
    transaction.esewaDetails.status = 'COMPLETE';
    transaction.esewaDetails.verifiedAt = new Date();

    // Update user wallet
    const user = await User.findById(transaction.user);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize wallet if not exists
    if (!user.sellerWallet) {
      user.sellerWallet = {
        credits: 0,
        totalRecharged: 0,
        totalSpent: 0
      };
    }

    user.sellerWallet.credits += transaction.amount;
    user.sellerWallet.totalRecharged += transaction.amount;
    user.sellerWallet.lastRechargeDate = new Date();

    transaction.balanceAfter = user.sellerWallet.credits;

    await user.save();
    await transaction.save();

    // Reactivate gear items if they were deactivated
    await reactivateGearItems(transaction.user);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      transaction: transaction,
      wallet: user.sellerWallet
    });
  } catch (error) {
    console.error('Verify eSewa payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// GET /api/wallet/esewa/status/:transactionUuid - Check payment status
exports.checkEsewaPaymentStatus = async (req, res) => {
  try {
    const { transactionUuid } = req.params;

    const transaction = await WalletTransaction.findOne({
      'esewaDetails.transactionUuid': transactionUuid,
      user: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If already completed, return status
    if (transaction.status === 'completed') {
      return res.json({
        status: 'completed',
        transaction: transaction
      });
    }

    // Check with eSewa if still pending
    if (transaction.status === 'pending') {
      try {
        const statusCheck = await esewaService.checkPaymentStatus(
          transactionUuid,
          transaction.esewaDetails.totalAmount
        );

        if (statusCheck.status === 'COMPLETE') {
          // Process the payment
          transaction.status = 'completed';
          transaction.esewaDetails.status = 'COMPLETE';
          transaction.esewaDetails.refId = statusCheck.ref_id;
          transaction.esewaDetails.verifiedAt = new Date();

          // Update user wallet
          const user = await User.findById(transaction.user);
          if (user) {
            if (!user.sellerWallet) {
              user.sellerWallet = {
                credits: 0,
                totalRecharged: 0,
                totalSpent: 0
              };
            }

            user.sellerWallet.credits += transaction.amount;
            user.sellerWallet.totalRecharged += transaction.amount;
            user.sellerWallet.lastRechargeDate = new Date();

            transaction.balanceAfter = user.sellerWallet.credits;

            await user.save();
            await transaction.save();

            await reactivateGearItems(transaction.user);
          }
        } else {
          transaction.esewaDetails.status = statusCheck.status;
          await transaction.save();
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    }

    res.json({
      status: transaction.status,
      esewaStatus: transaction.esewaDetails.status,
      transaction: transaction
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
};

// POST /api/wallet/recharge - Recharge seller wallet (legacy/manual)
exports.rechargeWallet = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid recharge amount' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize wallet if not exists
    if (!user.sellerWallet) {
      user.sellerWallet = {
        credits: 0,
        totalRecharged: 0,
        totalSpent: 0
      };
    }

    const balanceBefore = user.sellerWallet.credits;

    // Manual/test recharge
    user.sellerWallet.credits += amount;
    user.sellerWallet.totalRecharged += amount;
    user.sellerWallet.lastRechargeDate = new Date();

    await user.save();

    // Create transaction record
    const transaction = new WalletTransaction({
      user: req.userId,
      type: 'recharge',
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: user.sellerWallet.credits,
      description: `Manual wallet recharge - NPR ${amount}`,
      paymentMethod: paymentMethod || 'manual',
      status: 'completed'
    });

    await transaction.save();

    // Reactivate gear items if they were deactivated due to insufficient funds
    await reactivateGearItems(req.userId);

    res.json({
      message: 'Wallet recharged successfully',
      wallet: user.sellerWallet,
      rechargedAmount: amount
    });
  } catch (error) {
    console.error('Recharge wallet error:', error);
    res.status(500).json({ error: 'Failed to recharge wallet' });
  }
};

// POST /api/wallet/charge-listings - Charge monthly listing fees (admin/cron job)
// DEPRECATED: Now using commission-based system
exports.chargeListingFees = async (req, res) => {
  try {
    res.json({
      message: 'Listing fees system has been replaced with commission-based system',
      note: 'Commissions are now automatically deducted when bookings are completed'
    });
  } catch (error) {
    console.error('Charge listing fees error:', error);
    res.status(500).json({ error: 'Failed to charge listing fees' });
  }
};

// POST /api/wallet/deduct-commission - Deduct commission from completed booking
exports.deductCommission = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Get booking details
    const booking = await RentalBooking.findById(bookingId)
      .populate('gear', 'title')
      .populate('owner', 'sellerWallet');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only deduct commission for completed bookings
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only deduct commission from completed bookings' });
    }

    // Check if commission already deducted
    const existingTransaction = await WalletTransaction.findOne({
      user: booking.owner._id,
      type: 'deduction',
      'metadata.bookingId': bookingId
    });

    if (existingTransaction) {
      return res.json({
        message: 'Commission already deducted for this booking',
        transaction: existingTransaction
      });
    }

    // Get commission rate
    const commissionSetting = await SiteSettings.findOne({ settingKey: 'platformCommission' });
    const commissionRate = commissionSetting?.settingValue?.rate || DEFAULT_COMMISSION_RATE;
    const commissionEnabled = commissionSetting?.settingValue?.enabled !== false;

    if (!commissionEnabled) {
      return res.json({
        message: 'Commission system is disabled',
        commissionDeducted: 0
      });
    }

    // Calculate commission
    const commissionAmount = Math.round(booking.totalPrice * commissionRate / 100);

    // Get user
    const user = await User.findById(booking.owner._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize wallet if not exists
    if (!user.sellerWallet) {
      user.sellerWallet = {
        credits: 0,
        totalRecharged: 0,
        totalSpent: 0
      };
    }

    const balanceBefore = user.sellerWallet.credits;

    // Deduct commission
    user.sellerWallet.credits -= commissionAmount;
    user.sellerWallet.totalSpent += commissionAmount;

    await user.save();

    // Create transaction record
    const transaction = new WalletTransaction({
      user: booking.owner._id,
      type: 'deduction',
      amount: commissionAmount,
      balanceBefore: balanceBefore,
      balanceAfter: user.sellerWallet.credits,
      description: `Platform commission (${commissionRate}%) for booking #${booking._id.toString().slice(-6)} - ${booking.gear.title}`,
      paymentMethod: 'system',
      status: 'completed',
      metadata: {
        bookingId: bookingId,
        commissionRate: commissionRate,
        bookingAmount: booking.totalPrice,
        gearTitle: booking.gear.title
      }
    });

    await transaction.save();

    res.json({
      message: 'Commission deducted successfully',
      commissionAmount,
      commissionRate,
      bookingAmount: booking.totalPrice,
      newBalance: user.sellerWallet.credits,
      transaction
    });
  } catch (error) {
    console.error('Deduct commission error:', error);
    res.status(500).json({ error: 'Failed to deduct commission' });
  }
};

// GET /api/wallet/transactions - Get wallet transaction history
exports.getTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('sellerWallet');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get transaction history from WalletTransaction model
    const transactions = await WalletTransaction.find({
      user: req.userId
    })
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({
      wallet: user.sellerWallet,
      transactions: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Helper function to reactivate gear items
// DEPRECATED: No longer needed with commission-based system
async function reactivateGearItems(userId) {
  // Gear is no longer auto-deactivated based on wallet balance
  // Commission is deducted per booking instead
  return;
}

module.exports = exports;
