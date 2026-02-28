require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const GearRental = require('../models/GearRental');

const SAMPLE_GEAR = [
  {
    title: 'Osprey Atmos 65L Backpack',
    description: 'Premium trekking backpack with anti-gravity suspension system. Perfect for multi-day treks in the Himalayas. Includes rain cover and hydration reservoir.',
    category: 'Backpacks',
    condition: 'Excellent',
    pricePerDay: 500,
    location: 'Thamel, Kathmandu',
    specifications: {
      brand: 'Osprey',
      model: 'Atmos AG 65',
      size: 'Medium (65L)',
      weight: '2.1 kg',
      color: 'Graphite Grey'
    },
    minimumRentalDays: 3,
    deposit: 5000,
    images: ['https://images.unsplash.com/photo-1622260614153-03223fb72052?w=800']
  },
  {
    title: 'North Face 4-Season Tent',
    description: 'Durable 2-person tent suitable for high-altitude camping. Tested in extreme weather conditions. Easy setup with color-coded poles.',
    category: 'Tents',
    condition: 'Good',
    pricePerDay: 800,
    location: 'Lakeside, Pokhara',
    specifications: {
      brand: 'The North Face',
      model: 'Mountain 25',
      size: '2-Person',
      weight: '3.6 kg',
      color: 'Summit Gold'
    },
    minimumRentalDays: 2,
    deposit: 10000,
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800']
  },
  {
    title: 'Marmot -15°C Sleeping Bag',
    description: 'Down-filled sleeping bag rated for -15°C. Ideal for winter treks and high-altitude camping. Comes with compression sack.',
    category: 'Sleeping Bags',
    condition: 'Excellent',
    pricePerDay: 400,
    location: 'Thamel, Kathmandu',
    specifications: {
      brand: 'Marmot',
      model: 'CWM -40',
      size: 'Regular',
      weight: '1.8 kg',
      color: 'Team Red'
    },
    minimumRentalDays: 3,
    deposit: 8000,
    images: ['https://images.unsplash.com/photo-1520095972714-909e91b038e5?w=800']
  },
  {
    title: 'Black Diamond Trekking Poles (Pair)',
    description: 'Adjustable aluminum trekking poles with carbide tips. Shock-absorbing and collapsible for easy packing.',
    category: 'Trekking Poles',
    condition: 'Good',
    pricePerDay: 150,
    location: 'Thamel, Kathmandu',
    specifications: {
      brand: 'Black Diamond',
      model: 'Trail Pro',
      size: 'Adjustable 63-140cm',
      weight: '0.5 kg (pair)',
      color: 'Black'
    },
    minimumRentalDays: 1,
    deposit: 2000,
    images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800']
  },
  {
    title: 'MSR Camping Stove & Cookset',
    description: 'Compact camping stove with fuel canister and aluminum cookset. Includes pot, pan, and utensils for 2 people.',
    category: 'Camping Gear',
    condition: 'Good',
    pricePerDay: 300,
    location: 'Lakeside, Pokhara',
    specifications: {
      brand: 'MSR',
      model: 'PocketRocket 2',
      size: 'Compact',
      weight: '1.2 kg',
      color: 'Silver'
    },
    minimumRentalDays: 2,
    deposit: 4000,
    images: ['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800']
  },
  {
    title: 'Petzl Climbing Harness',
    description: 'Professional climbing harness with adjustable leg loops. Suitable for rock climbing and mountaineering.',
    category: 'Climbing Equipment',
    condition: 'Excellent',
    pricePerDay: 250,
    location: 'Thamel, Kathmandu',
    specifications: {
      brand: 'Petzl',
      model: 'Corax',
      size: 'Size 1 (M/L)',
      weight: '0.4 kg',
      color: 'Blue'
    },
    minimumRentalDays: 1,
    deposit: 3000,
    images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800']
  },
  {
    title: 'Columbia Winter Jacket',
    description: 'Insulated winter jacket with waterproof outer shell. Perfect for high-altitude treks and winter expeditions.',
    category: 'Winter Gear',
    condition: 'Good',
    pricePerDay: 350,
    location: 'Thamel, Kathmandu',
    specifications: {
      brand: 'Columbia',
      model: 'Powder Keg II',
      size: 'Large',
      weight: '1.0 kg',
      color: 'Black'
    },
    minimumRentalDays: 3,
    deposit: 6000,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800']
  },
  {
    title: 'Garmin GPS Watch',
    description: 'Multi-sport GPS watch with altimeter, barometer, and compass. Tracks routes and provides navigation assistance.',
    category: 'Electronics',
    condition: 'Excellent',
    pricePerDay: 600,
    location: 'Lakeside, Pokhara',
    specifications: {
      brand: 'Garmin',
      model: 'Fenix 6',
      size: 'Standard',
      weight: '0.08 kg',
      color: 'Black'
    },
    minimumRentalDays: 5,
    deposit: 15000,
    images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800']
  }
];

async function seedGear() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all users
    const users = await User.find();
    
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      process.exit(0);
    }

    console.log(`Found ${users.length} users`);

    // Clear existing gear
    await GearRental.deleteMany({});
    console.log('Cleared existing gear listings\n');

    // Create gear for different users
    const createdGear = [];
    
    for (let i = 0; i < SAMPLE_GEAR.length; i++) {
      const gearData = SAMPLE_GEAR[i];
      const owner = users[i % users.length]; // Distribute gear among users

      const gear = await GearRental.create({
        ...gearData,
        owner: owner._id
      });

      createdGear.push(gear);
      console.log(`✓ Created: ${gear.title} (Owner: ${owner.name})`);
    }

    console.log(`\n✅ Successfully created ${createdGear.length} gear listings!`);
    console.log('\nGear by category:');
    
    const categories = {};
    createdGear.forEach(gear => {
      categories[gear.category] = (categories[gear.category] || 0) + 1;
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });

    console.log('\nYou can now view the gear at: http://localhost:3000/#/gear');

  } catch (error) {
    console.error('Error seeding gear:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

seedGear();
