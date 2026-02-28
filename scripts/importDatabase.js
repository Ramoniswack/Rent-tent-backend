require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import all models
const User = require('../models/User');
const Trip = require('../models/Trip');
const Match = require('../models/Match');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const GearRental = require('../models/GearRental');
const RentalBooking = require('../models/RentalBooking');
const WalletTransaction = require('../models/WalletTransaction');
const Page = require('../models/Page');
const ProfileFieldOptions = require('../models/ProfileFieldOptions');
const SiteSettings = require('../models/SiteSettings');
const Newsletter = require('../models/Newsletter');
const PackingItem = require('../models/PackingItem');

const collections = [
  { name: 'users', model: User },
  { name: 'trips', model: Trip },
  { name: 'matches', model: Match },
  { name: 'messages', model: Message },
  { name: 'notifications', model: Notification },
  { name: 'gearrentals', model: GearRental },
  { name: 'rentalbookings', model: RentalBooking },
  { name: 'wallettransactions', model: WalletTransaction },
  { name: 'pages', model: Page },
  { name: 'profilefieldoptions', model: ProfileFieldOptions },
  { name: 'sitesettings', model: SiteSettings },
  { name: 'newsletters', model: Newsletter },
  { name: 'packingitems', model: PackingItem }
];

async function importDatabase(importDir) {
  try {
    if (!importDir) {
      console.error('Please provide the import directory path as an argument.');
      console.log('Usage: node scripts/importDatabase.js <export-directory-name>');
      console.log('Example: node scripts/importDatabase.js export-2026-02-28T17-49-19-493Z');
      process.exit(1);
    }

    const fullImportPath = path.join(__dirname, '../dump', importDir);
    
    if (!fs.existsSync(fullImportPath)) {
      console.error(`Import directory not found: ${fullImportPath}`);
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    console.log(`\nImporting database from: ${fullImportPath}\n`);

    for (const collection of collections) {
      try {
        const filePath = path.join(fullImportPath, `${collection.name}.json`);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⊘ Skipping ${collection.name} (file not found)`);
          continue;
        }

        console.log(`Importing ${collection.name}...`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.length === 0) {
          console.log(`⊘ No documents to import for ${collection.name}`);
          continue;
        }

        // Clear existing data (optional - comment out if you want to merge)
        await collection.model.deleteMany({});
        
        // Insert data
        await collection.model.insertMany(data);
        
        console.log(`✓ Imported ${data.length} documents to ${collection.name}`);
      } catch (error) {
        console.log(`✗ Error importing ${collection.name}:`, error.message);
      }
    }

    console.log('\n✓ Database import completed successfully!');
    
  } catch (error) {
    console.error('Error importing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Get import directory from command line argument
const importDir = process.argv[2];
importDatabase(importDir);
