const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testAboutPageUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Page = require('../models/Page');
    const User = require('../models/User');

    // Find the about page
    const aboutPage = await Page.findOne({ slug: 'about' });
    if (!aboutPage) {
      console.log('❌ About page not found in database');
      return;
    }

    console.log('✅ About page found');
    console.log('Current content structure:', JSON.stringify(aboutPage.content, null, 2));

    // Find an admin user
    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('✅ Admin user found:', admin.email);

    // Test update
    const testContent = {
      ...aboutPage.content,
      hero: {
        ...aboutPage.content.hero,
        badge: 'TEST UPDATE - ' + new Date().toISOString()
      }
    };

    const updated = await Page.findOneAndUpdate(
      { slug: 'about' },
      { 
        content: testContent, 
        updatedAt: new Date(), 
        lastModifiedBy: admin._id 
      },
      { new: true, runValidators: true }
    );

    if (updated) {
      console.log('✅ Update successful!');
      console.log('New badge text:', updated.content.hero.badge);
    } else {
      console.log('❌ Update failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

testAboutPageUpdate();
