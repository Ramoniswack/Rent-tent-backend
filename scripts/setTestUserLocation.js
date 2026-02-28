const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function setTestUserLocation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'testuser2@test.com' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    // Set location to New York City
    user.geoLocation = {
      type: 'Point',
      coordinates: [-73.935242, 40.730610] // [longitude, latitude]
    };
    user.location = 'New York, NY';
    user.age = '28';
    user.gender = 'Male';
    user.interests = ['Hiking', 'Photography', 'Food'];
    user.travelStyle = 'Adventure';

    await user.save();
    console.log('✅ Test user location set successfully!');
    console.log('Location:', user.location);
    console.log('Coordinates:', user.geoLocation.coordinates);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

setTestUserLocation();
