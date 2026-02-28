require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');

async function resetAllMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count current matches
    const currentCount = await Match.countDocuments();
    console.log(`\nCurrent match records: ${currentCount}`);

    // Delete all matches
    const result = await Match.deleteMany({});
    console.log(`Deleted ${result.deletedCount} match records`);

    console.log('\n✅ All match interactions have been reset!');
    console.log('Users can now see all profiles again in the match page.');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAllMatches();
