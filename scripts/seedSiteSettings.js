const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedSiteSettings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const defaultSettings = [
      {
        settingKey: 'serviceFeePercentage',
        settingValue: 5,
        description: 'Service fee percentage applied to gear rentals (e.g., 5 for 5%)'
      },
      {
        settingKey: 'platformName',
        settingValue: 'NomadNotes',
        description: 'Name of the platform'
      },
      {
        settingKey: 'supportEmail',
        settingValue: 'support@travelbuddy.com',
        description: 'Support email address'
      },
      {
        settingKey: 'logoText',
        settingValue: 'NomadNotes',
        description: 'Logo text displayed in header'
      },
      {
        settingKey: 'footerTagline',
        settingValue: 'Empowering the modern explorer with tools to travel further, work smarter, and live freely.',
        description: 'Footer tagline/description'
      },
      {
        settingKey: 'facebookUrl',
        settingValue: 'https://facebook.com',
        description: 'Facebook profile URL'
      },
      {
        settingKey: 'twitterUrl',
        settingValue: 'https://twitter.com',
        description: 'Twitter profile URL'
      },
      {
        settingKey: 'instagramUrl',
        settingValue: 'https://instagram.com',
        description: 'Instagram profile URL'
      },
      {
        settingKey: 'newsletterText',
        settingValue: 'Join our newsletter to get the latest travel tips and gear updates.',
        description: 'Newsletter subscription text in footer'
      },
      {
        settingKey: 'copyrightText',
        settingValue: '© 2024 NomadNotes. All rights reserved.',
        description: 'Copyright text in footer'
      }
    ];

    for (const setting of defaultSettings) {
      await SiteSettings.findOneAndUpdate(
        { settingKey: setting.settingKey },
        setting,
        { upsert: true, new: true }
      );
      console.log(`${setting.settingKey} setting seeded successfully`);
    }

    console.log('All site settings seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding site settings:', error);
    process.exit(1);
  }
};

seedSiteSettings();
