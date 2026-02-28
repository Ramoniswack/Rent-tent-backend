require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Message = require('../models/Message');
const RentalBooking = require('../models/RentalBooking');
const User = require('../models/User');

async function checkMessagesData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userId = '69981465e7935927ce12252f'; // bishal baniya

    console.log('📊 Checking data for user:', userId);
    console.log('='.repeat(50));

    // Check matches
    console.log('\n1. MATCHES:');
    const matches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ],
      matched: true
    })
    .populate('user1', 'name email')
    .populate('user2', 'name email');

    console.log(`   Found ${matches.length} matches`);
    matches.forEach((match, i) => {
      const otherUser = match.user1._id.toString() === userId ? match.user2 : match.user1;
      console.log(`   ${i + 1}. ${otherUser.name} (${otherUser.email})`);
    });

    // Check mutual connections
    console.log('\n2. MUTUAL CONNECTIONS:');
    const currentUser = await User.findById(userId).select('following');
    let mutualCount = 0;
    
    if (currentUser && currentUser.following && currentUser.following.length > 0) {
      for (const followingId of currentUser.following) {
        const otherUser = await User.findById(followingId).select('following name email');
        if (otherUser && otherUser.following && otherUser.following.some(id => id.toString() === userId)) {
          mutualCount++;
          console.log(`   ${mutualCount}. ${otherUser.name} (${otherUser.email})`);
        }
      }
    }
    console.log(`   Found ${mutualCount} mutual connections`);

    // Check rental bookings
    console.log('\n3. RENTAL BOOKINGS:');
    const rentalBookings = await RentalBooking.find({
      $or: [
        { renter: userId },
        { owner: userId }
      ]
    })
    .populate('renter', 'name email')
    .populate('owner', 'name email');

    console.log(`   Found ${rentalBookings.length} rental bookings`);
    rentalBookings.forEach((booking, i) => {
      const otherUser = booking.renter._id.toString() === userId ? booking.owner : booking.renter;
      console.log(`   ${i + 1}. ${otherUser.name} (${otherUser.email}) - Status: ${booking.status}`);
    });

    // Check messages
    console.log('\n4. MESSAGES:');
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`   Found ${messages.length} recent messages`);
    messages.forEach((msg, i) => {
      const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      console.log(`   ${i + 1}. ${otherUser.name}: ${msg.text?.substring(0, 50) || '[Image]'}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Data check complete');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

checkMessagesData();
