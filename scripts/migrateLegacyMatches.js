const mongoose = require('mongoose');
require('dotenv').config();

const Match = require('../models/Match');

async function migrateLegacyMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔄 Migrating legacy match data...\n');

    // Find all matches that need migration
    const allMatches = await Match.find({});
    
    console.log(`📊 Found ${allMatches.length} total matches\n`);

    let migratedCount = 0;
    let alreadyMigratedCount = 0;

    for (const match of allMatches) {
      let needsUpdate = false;
      const updates = {};

      // Migrate user1
      if (match.user1Liked === true && match.user1Status !== 'like') {
        updates.user1Status = 'like';
        needsUpdate = true;
      } else if (match.user1Liked === false && match.user1Status === 'none') {
        // Keep as 'none' - this is correct
      }

      // Migrate user2
      if (match.user2Liked === true && match.user2Status !== 'like') {
        updates.user2Status = 'like';
        needsUpdate = true;
      } else if (match.user2Liked === false && match.user2Status === 'none') {
        // Keep as 'none' - this is correct
      }

      // Check if match status needs updating
      if (match.user1Status === 'like' && match.user2Status === 'like' && !match.matched) {
        updates.matched = true;
        updates.matchedAt = new Date();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Match.updateOne({ _id: match._id }, { $set: updates });
        migratedCount++;
        console.log(`✓ Migrated match: ${match._id}`);
        console.log(`  Updates:`, updates);
      } else {
        alreadyMigratedCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  - Total matches: ${allMatches.length}`);
    console.log(`  - Migrated: ${migratedCount}`);
    console.log(`  - Already correct: ${alreadyMigratedCount}`);
    console.log('\n✅ Migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateLegacyMatches();
