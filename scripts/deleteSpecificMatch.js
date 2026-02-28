const mongoose = require('mongoose');
const Match = require('../models/Match');
require('dotenv').config();

async function deleteSpecificMatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const matchId = '6998146de7935927ce122548';
    
    const match = await Match.findById(matchId);
    
    if (match) {
      console.log('Found match:');
      console.log('   Match ID:', match._id);
      console.log('   User 1:', match.user1);
      console.log('   User 2:', match.user2);
      console.log('   User 1 Status:', match.user1Status);
      console.log('   User 2 Status:', match.user2Status);
      console.log('   Matched:', match.matched);
      console.log('');
      
      await Match.findByIdAndDelete(matchId);
      console.log('✅ Match deleted successfully');
      console.log('💡 Users will now appear in each other\'s discovery feed');
    } else {
      console.log('❌ Match not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

deleteSpecificMatch();
