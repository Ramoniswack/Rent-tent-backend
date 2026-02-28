const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testAboutPageHTTP() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    const jwt = require('jsonwebtoken');

    // Find an admin user
    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('✅ Admin user found:', admin.email);

    // Generate token
    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET);
    console.log('✅ Token generated');

    // Test content
    const testContent = {
      hero: {
        badge: 'HTTP TEST - ' + new Date().toISOString(),
        title: 'Test Title',
        description: ['Test description'],
        image: 'https://test.com/image.jpg'
      },
      values: [],
      mission: { quote: 'Test', attribution: 'Test' },
      team: { title: 'Test', subtitle: 'Test', members: [] },
      cta: { icon: 'Mail', title: 'Test', buttonText: 'Test', buttonLink: '/test' }
    };

    // Make HTTP request
    const response = await fetch('http://localhost:5000/api/admin/pages/about', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: testContent })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Update successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log('❌ Update failed');
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

testAboutPageHTTP();
