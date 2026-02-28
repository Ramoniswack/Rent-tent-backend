const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function seedTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get some existing users and update them with test data
    const users = await User.find().limit(5);
    
    const testData = [
      {
        geoLocation: { type: 'Point', coordinates: [-73.945242, 40.740610] }, // 1km from test user
        location: 'Brooklyn, NY',
        age: '25',
        gender: 'Female',
        interests: ['Hiking', 'Photography', 'Yoga'],
        travelStyle: 'Adventure'
      },
      {
        geoLocation: { type: 'Point', coordinates: [-73.955242, 40.750610] }, // 2km from test user
        location: 'Manhattan, NY',
        age: '30',
        gender: 'Male',
        interests: ['Food', 'Photography', 'Music'],
        travelStyle: 'Cultural'
      },
      {
        geoLocation: { type: 'Point', coordinates: [-73.925242, 40.720610] }, // 1.5km from test user
        location: 'Queens, NY',
        age: '27',
        gender: 'Female',
        interests: ['Hiking', 'Food', 'Art'],
        travelStyle: 'Adventure'
      },
      {
        geoLocation: { type: 'Point', coordinates: [-73.965242, 40.760610] }, // 3km from test user
        location: 'Upper West Side, NY',
        age: '32',
        gender: 'Non-binary',
        interests: ['Photography', 'Food', 'Theater'],
        travelStyle: 'Luxury'
      },
      {
        geoLocation: { type: 'Point', coordinates: [-73.915242, 40.710610] }, // 2.5km from test user
        location: 'East Village, NY',
        age: '26',
        gender: 'Male',
        interests: ['Hiking', 'Photography', 'Food', 'Surfing'],
        travelStyle: 'Adventure'
      }
    ];

    for (let i = 0; i < Math.min(users.length, testData.length); i++) {
      const user = users[i];
      Object.assign(user, testData[i]);
      await user.save();
      console.log(`✅ Updated ${user.name} (${user.email})`);
    }

    console.log('\n✅ Test users seeded successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedTestUsers();
