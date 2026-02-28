const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testAllMatchEndpoints() {
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

    console.log('Testing Match Endpoints for:', user.name);
    console.log('User ID:', user._id.toString());
    console.log('='.repeat(60));

    // Test 1: Discover endpoint
    console.log('\n1. Testing /api/matches/discover (Discover Tab)');
    console.log('-'.repeat(60));
    try {
      const discoverResponse = await axios.get('http://localhost:5000/api/matches/discover', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Status:', discoverResponse.status);
      console.log('   Count:', discoverResponse.data.count);
      console.log('   Profiles:', discoverResponse.data.profiles?.length || 0);
      if (discoverResponse.data.profiles?.length > 0) {
        console.log('   First 3:');
        discoverResponse.data.profiles.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - ${p.distance}km away`);
        });
      }
    } catch (err) {
      console.error('❌ Error:', err.response?.data || err.message);
    }

    // Test 2: Matches endpoint (Mutual)
    console.log('\n2. Testing /api/matches (Mutual Tab)');
    console.log('-'.repeat(60));
    try {
      const matchesResponse = await axios.get('http://localhost:5000/api/matches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Status:', matchesResponse.status);
      console.log('   Mutual Matches:', matchesResponse.data.length);
      if (matchesResponse.data.length > 0) {
        console.log('   Matched with:');
        matchesResponse.data.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.user.name} - matched at ${new Date(m.matchedAt).toLocaleDateString()}`);
        });
      } else {
        console.log('   No mutual matches yet');
      }
    } catch (err) {
      console.error('❌ Error:', err.response?.data || err.message);
    }

    // Test 3: Likes endpoint (Incoming)
    console.log('\n3. Testing /api/matches/likes (Incoming Tab)');
    console.log('-'.repeat(60));
    try {
      const likesResponse = await axios.get('http://localhost:5000/api/matches/likes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Status:', likesResponse.status);
      console.log('   Incoming Likes:', likesResponse.data.length);
      if (likesResponse.data.length > 0) {
        console.log('   Liked by:');
        likesResponse.data.forEach((l, i) => {
          console.log(`   ${i + 1}. ${l.user.name} - liked at ${new Date(l.likedAt).toLocaleDateString()}`);
        });
      } else {
        console.log('   No incoming likes yet');
      }
    } catch (err) {
      console.error('❌ Error:', err.response?.data || err.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('All tests completed!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAllMatchEndpoints();
