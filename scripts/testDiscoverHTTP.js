const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testDiscoverHTTP() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get a test user and generate a token
    const user = await User.findOne({ email: 'baniya@baniya.baniya' });
    
    if (!user) {
      console.log('Test user not found');
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Testing /api/matches/discover endpoint');
    console.log('User:', user.name);
    console.log('Token generated\n');

    // Make HTTP request
    const response = await axios.get('http://localhost:5000/api/matches/discover', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('\nResponse data:');
    console.log('- Success:', response.data.success);
    console.log('- Count:', response.data.count);
    console.log('- Profiles:', response.data.profiles?.length || 0);
    
    if (response.data.profiles && response.data.profiles.length > 0) {
      console.log('\nFirst 3 profiles:');
      response.data.profiles.slice(0, 3).forEach((profile, i) => {
        console.log(`${i + 1}. ${profile.name} - ${profile.distance}km away`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('\nFull error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDiscoverHTTP();
