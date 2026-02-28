const mongoose = require('mongoose');
const Match = require('../models/Match');
require('dotenv').config();

async function cleanupEmptyMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all matches where both users have status 'none' and not matched
    const emptyMatches = await Match.find({
      user1Status: 'none',
      user2Status: 'none',
      matched: false
    });

    console.log(`Found ${emptyMatches.length} empty match records (no interactions)\n`);

    if (emptyMatches.length > 0) {
      console.log('Empty match records:');
      emptyMatches.forEach((match, index) => {
        console.log(`${index + 1}. Match ID: ${match._id}`);
        console.log(`   User 1: ${match.user1}`);
        console.log(`   User 2: ${match.user2}`);
        console.log(`   Created: ${match.createdAt}`);
        console.log('');
      });

      console.log('🗑️  Deleting empty match records...');
      const result = await Match.deleteMany({
        user1Status: 'none',
        user2Status: 'none',
        matched: false
      });

      console.log(`✅ Deleted ${result.deletedCount} empty match records`);
      console.log('');
      console.log('💡 These users will now appear in each other\'s discovery feed again');
    } else {
      console.log('✅ No empty match records found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

cleanupEmptyMatches();
