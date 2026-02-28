const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
require('dotenv').config();

async function testAPIForUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const user1Id = '699603de3b896fac9a1516f8'; // mrbishalbaniya
    const user2Id = '6997ea13cabe9baad628cb96'; // sush1

    console.log('=== Testing getMatches API Logic ===\n');

    // Simulate getMatches for user1 (mrbishalbaniya)
    console.log('1. For mrbishalbaniya (Bishal Baniya):\n');
    
    const matches1 = await Match.find({
      $or: [
        { user1: user1Id },
        { user2: user1Id }
      ],
      matched: true
    })
    .populate('user1', 'name email profilePicture username')
    .populate('user2', 'name email profilePicture username')
    .lean();

    console.log(`   Found ${matches1.length} matches with matched=true`);
    
    const matchesWithDetails1 = await Promise.all(
      matches1.map(async (match) => {
        const otherUser = match.user1._id.toString() === user1Id ? match.user2 : match.user1;
        
        if (!otherUser) {
          console.log('   ⚠️  Skipping match with NULL user');
          return null;
        }
        
        const isUser1 = match.user1._id.toString() === user1Id;
        const userSettings = isUser1 ? match.user1Settings : match.user2Settings;
        
        const lastMessage = await Message.findOne({
          $or: [
            { sender: user1Id, receiver: otherUser._id },
            { sender: otherUser._id, receiver: user1Id }
          ]
        }).sort({ createdAt: -1 }).lean();

        const unreadCount = await Message.countDocuments({
          sender: otherUser._id,
          receiver: user1Id,
          read: false
        });

        return {
          id: otherUser._id,
          name: userSettings?.nickname || otherUser.name,
          username: otherUser.username,
          email: otherUser.email,
          lastMessage: lastMessage ? (lastMessage.image ? '📷 Image' : lastMessage.text) : 'Start a conversation',
          timestamp: lastMessage ? lastMessage.createdAt : match.matchedAt,
          unread: unreadCount
        };
      })
    );

    const validMatches1 = matchesWithDetails1.filter(m => m !== null);
    console.log(`   Valid matches after filtering: ${validMatches1.length}\n`);
    
    validMatches1.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (@${m.username})`);
      console.log(`      Email: ${m.email}`);
      console.log(`      Last: ${m.lastMessage.substring(0, 50)}...`);
      console.log(`      Unread: ${m.unread}`);
      console.log('');
    });

    // Check if sush1 is in the list
    const hasSush1 = validMatches1.some(m => m.username === 'sush1');
    console.log(`   ✅ sush1 in list: ${hasSush1 ? 'YES' : 'NO'}\n`);

    // Simulate getMatches for user2 (sush1)
    console.log('2. For sush1 (Smita Kunwar):\n');
    
    const matches2 = await Match.find({
      $or: [
        { user1: user2Id },
        { user2: user2Id }
      ],
      matched: true
    })
    .populate('user1', 'name email profilePicture username')
    .populate('user2', 'name email profilePicture username')
    .lean();

    console.log(`   Found ${matches2.length} matches with matched=true`);
    
    const matchesWithDetails2 = await Promise.all(
      matches2.map(async (match) => {
        const otherUser = match.user1._id.toString() === user2Id ? match.user2 : match.user1;
        
        if (!otherUser) {
          console.log('   ⚠️  Skipping match with NULL user');
          return null;
        }
        
        const isUser1 = match.user1._id.toString() === user2Id;
        const userSettings = isUser1 ? match.user1Settings : match.user2Settings;
        
        const lastMessage = await Message.findOne({
          $or: [
            { sender: user2Id, receiver: otherUser._id },
            { sender: otherUser._id, receiver: user2Id }
          ]
        }).sort({ createdAt: -1 }).lean();

        const unreadCount = await Message.countDocuments({
          sender: otherUser._id,
          receiver: user2Id,
          read: false
        });

        return {
          id: otherUser._id,
          name: userSettings?.nickname || otherUser.name,
          username: otherUser.username,
          email: otherUser.email,
          lastMessage: lastMessage ? (lastMessage.image ? '📷 Image' : lastMessage.text) : 'Start a conversation',
          timestamp: lastMessage ? lastMessage.createdAt : match.matchedAt,
          unread: unreadCount
        };
      })
    );

    const validMatches2 = matchesWithDetails2.filter(m => m !== null);
    console.log(`   Valid matches after filtering: ${validMatches2.length}\n`);
    
    validMatches2.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (@${m.username})`);
      console.log(`      Email: ${m.email}`);
      console.log(`      Last: ${m.lastMessage.substring(0, 50)}...`);
      console.log(`      Unread: ${m.unread}`);
      console.log('');
    });

    // Check if mrbishalbaniya is in the list
    const hasBishal = validMatches2.some(m => m.username === 'mrbishalbaniya');
    console.log(`   ✅ mrbishalbaniya in list: ${hasBishal ? 'YES' : 'NO'}\n`);

    console.log('=== Summary ===');
    console.log(`mrbishalbaniya can see sush1: ${hasSush1 ? '✅ YES' : '❌ NO'}`);
    console.log(`sush1 can see mrbishalbaniya: ${hasBishal ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testAPIForUsers();
