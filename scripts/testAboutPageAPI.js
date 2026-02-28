const mongoose = require('mongoose');
const Page = require('../models/Page');
require('dotenv').config();

const testAboutPage = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check if About page exists
    const aboutPage = await Page.findOne({ slug: 'about' });
    
    if (!aboutPage) {
      console.log('❌ About page not found in database!');
      console.log('Run: node scripts/seedAboutPage.js');
      return;
    }

    console.log('✅ About page found!');
    console.log('Title:', aboutPage.title);
    console.log('Slug:', aboutPage.slug);
    console.log('Published:', aboutPage.isPublished);
    console.log('Content type:', typeof aboutPage.content);
    console.log('\nContent structure:');
    console.log('- Has hero:', !!aboutPage.content?.hero);
    console.log('- Has values:', !!aboutPage.content?.values);
    console.log('- Has mission:', !!aboutPage.content?.mission);
    console.log('- Has team:', !!aboutPage.content?.team);
    console.log('- Has cta:', !!aboutPage.content?.cta);
    
    if (aboutPage.content?.team?.members) {
      console.log('- Team members count:', aboutPage.content.team.members.length);
    }
    
    console.log('\nFull content preview:');
    console.log(JSON.stringify(aboutPage.content, null, 2).substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

testAboutPage();
