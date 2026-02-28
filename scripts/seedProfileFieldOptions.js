const mongoose = require('mongoose');
const ProfileFieldOptions = require('../models/ProfileFieldOptions');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedProfileFieldOptions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const defaultOptions = [
      {
        fieldType: 'travelStyles',
        options: ['Adventure', 'Relaxed', 'Cultural', 'Extreme', 'Slow Travel', 'Luxury', 'Budget']
      },
      {
        fieldType: 'interests',
        options: [
          'Trekking', 'Photography', 'Culture', 'Food', 'Hiking', 'Yoga', 
          'Meditation', 'Local Cuisine', 'Mountaineering', 'Rock Climbing', 
          'Camping', 'Coworking', 'Cafes', 'History', 'Language Exchange'
        ]
      },
      {
        fieldType: 'languages',
        options: [
          'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
          'Mandarin', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Russian', 'Nepali'
        ]
      },
      {
        fieldType: 'gearCategories',
        options: [
          'Camping', 'Photography', 'Tech', 'Office', 'Sports', 'Audio',
          'Backpacks', 'Sleeping Bags', 'Trekking Poles', 'Camping Gear',
          'Water Filters', 'Climbing Equipment', 'Winter Gear', 'Electronics',
          'Kitchen', 'Other'
        ]
      },
      {
        fieldType: 'gearConditions',
        options: ['Like New', 'Excellent', 'Good', 'Fair', 'Well-Used']
      },
      {
        fieldType: 'bookingFeatures',
        features: [
          {
            icon: 'Sparkles',
            title: 'Deep Cleaned',
            description: 'Every item is professionally sanitized and inspected after each use to ensure peak performance.'
          },
          {
            icon: 'Truck',
            title: 'Free Pickup',
            description: 'Pick up from our central hubs or have it delivered to your trailhead for a small fee.'
          },
          {
            icon: 'Headphones',
            title: '24/7 Adventure Support',
            description: 'Stuck in the wild? Our gear experts are available via satellite phone/chat to help you out.'
          }
        ]
      },
      {
        fieldType: 'footerProductMenu',
        menuItems: [
          { label: 'Match', url: '/match' },
          { label: 'Gear Rental', url: '/gear' },
          { label: 'Messages', url: '/messages' },
          { label: 'Map', url: '/map' }
        ]
      },
      {
        fieldType: 'footerCompanyMenu',
        menuItems: [
          { label: 'About Us', url: '/about' },
          { label: 'Contact', url: '/contact' },
          { label: 'Careers', url: '#' },
          { label: 'Community', url: '#' },
          { label: 'Blog', url: '#' }
        ]
      }
    ];

    for (const option of defaultOptions) {
      await ProfileFieldOptions.findOneAndUpdate(
        { fieldType: option.fieldType },
        option,
        { upsert: true, new: true }
      );
      console.log(`${option.fieldType} options seeded successfully`);
    }

    console.log('All profile field options seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding profile field options:', error);
    process.exit(1);
  }
};

seedProfileFieldOptions();
