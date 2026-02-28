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

async function exportDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    const dumpDir = path.join(__dirname, '../dump');
    
    // Create dump directory if it doesn't exist
    if (!fs.existsSync(dumpDir)) {
      fs.mkdirSync(dumpDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(dumpDir, `export-${timestamp}`);
    fs.mkdirSync(exportDir, { recursive: true });

    console.log(`\nExporting database to: ${exportDir}\n`);

    for (const collection of collections) {
      try {
        console.log(`Exporting ${collection.name}...`);
        const data = await collection.model.find({}).lean();
        
        const filePath = path.join(exportDir, `${collection.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`✓ Exported ${data.length} documents from ${collection.name}`);
      } catch (error) {
        console.log(`✗ Error exporting ${collection.name}:`, error.message);
      }
    }

    // Create a metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      databaseUri: process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials
      collections: collections.map(c => c.name)
    };
    
    fs.writeFileSync(
      path.join(exportDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n✓ Database export completed successfully!');
    console.log(`Export location: ${exportDir}`);
    
  } catch (error) {
    console.error('Error exporting database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

exportDatabase();
