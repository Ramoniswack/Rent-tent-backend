require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');

async function cleanupCorruptedMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find matches with null users
    const corruptedMatches = await Match.find({
      $or: [
        { user1: null },
        { user2: null }
      ]
    });

    console.log(`\nFound ${corruptedMatches.length} corrupted match records`);

    if (corruptedMatches.length > 0) {
      // Delete corrupted matches
      const result = await Match.deleteMany({
        $or: [
          { user1: null },
          { user2: null }
        ]
      });

      console.log(`Deleted ${result.deletedCount} corrupted match records`);
    }

    // Also find matches where users don't exist anymore
    const allMatches = await Match.find({}).populate('user1 user2');
    let deletedCount = 0;

    for (const match of allMatches) {
      if (!match.user1 || !match.user2) {
        await Match.findByIdAndDelete(match._id);
        deletedCount++;
        console.log(`Deleted match ${match._id} - missing user reference`);
      }
    }

    console.log(`\nTotal cleanup: Deleted ${deletedCount} matches with missing user references`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupCorruptedMatches();
