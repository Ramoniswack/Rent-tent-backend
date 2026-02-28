require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');

async function syncMatchStatusFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all matches where status fields don't match legacy fields
    const matches = await Match.find({});
    
    console.log(`Found ${matches.length} total match records\n`);

    let updatedCount = 0;
    let alreadyCorrectCount = 0;

    for (const match of matches) {
      let needsUpdate = false;
      const updates = {};

      // Check user1
      if (match.user1Liked && match.user1Status !== 'like') {
        updates.user1Status = 'like';
        needsUpdate = true;
      } else if (!match.user1Liked && match.user1Status === 'like') {
        // Legacy field says not liked, but status says like - trust the status field
        // This shouldn't happen, but if it does, update legacy to match status
        updates.user1Liked = true;
        needsUpdate = true;
      } else if (!match.user1Liked && match.user1Status === 'none') {
        // Both say no like - this is correct
        alreadyCorrectCount++;
      }

      // Check user2
      if (match.user2Liked && match.user2Status !== 'like') {
        updates.user2Status = 'like';
        needsUpdate = true;
      } else if (!match.user2Liked && match.user2Status === 'like') {
        updates.user2Liked = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Match.updateOne({ _id: match._id }, { $set: updates });
        console.log(`✅ Updated match ${match._id}:`);
        console.log(`   Updates: ${JSON.stringify(updates)}`);
        updatedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total matches: ${matches.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already correct: ${alreadyCorrectCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

syncMatchStatusFields();
