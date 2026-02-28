const mongoose = require('mongoose');
const Page = require('../models/Page');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedHomePage = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const homeContent = {
      hero: {
        badge: 'Now optimized for Nepal & The Himalayas',
        title: 'Master Your Next',
        titleHighlight: 'Himalayan Trek',
        description: 'The ultimate full-stack companion for travelers. Plan itineraries, rent premium gear peer-to-peer, find trekking partners, and track expenses—all available offline.',
        backgroundImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&q=80',
        ctaPrimary: { text: 'Start Exploring Free', link: '/register' },
        ctaSecondary: { text: 'See How It Works', link: '#features' },
        stats: [
          { value: '50k+', label: 'Active Nomads' },
          { value: '10k+', label: 'Gear Listings' },
          { value: '100%', label: 'Offline Capable' }
        ]
      },
      features: {
        badge: 'Platform Features',
        title: 'Built for the Rigors of Remote Travel',
        description: 'Everything you need to seamlessly transition from planning in Kathmandu to trekking the high passes.',
        items: [
          {
            title: 'Smart Trip Management',
            description: 'Collaborate on detailed itineraries with interactive Leaflet maps, custom markers, and weather integration for high-altitude passes.',
            icon: 'Map',
            colSpan: 'lg:col-span-2',
            accent: 'from-emerald-500/20 to-transparent'
          },
          {
            title: 'Gear Rental Marketplace',
            description: 'Peer-to-peer equipment rental. Find or list trekking gear with GPS coordinates, security deposits, and real-time booking tracking.',
            icon: 'Tent',
            colSpan: 'lg:col-span-1',
            accent: 'from-teal-500/20 to-transparent'
          },
          {
            title: 'Travel Match',
            description: 'Find your perfect trekking partner. Swipe to match based on travel style, pace, and route, complete with real-time chat.',
            icon: 'Users',
            colSpan: 'lg:col-span-1',
            accent: 'from-rose-500/20 to-transparent'
          },
          {
            title: 'Multi-Currency Expenses',
            description: 'Track costs in NPR, USD, EUR and more. Real-time exchange rates and visual charts keep your Everest Base Camp budget in check.',
            icon: 'Wallet',
            colSpan: 'lg:col-span-2',
            accent: 'from-blue-500/20 to-transparent'
          },
          {
            title: 'Pro Packing Lists',
            description: 'Never forget your crampons. Use built-in templates for Trekking or City Tours, categorized by Gear, Medical, and Documents.',
            icon: 'CheckSquare',
            colSpan: 'lg:col-span-2',
            accent: 'from-amber-500/20 to-transparent'
          },
          {
            title: 'True Offline PWA',
            description: 'Zero connectivity on the Annapurna Circuit? No problem. Access maps, bookings, and sync automatically when back in Kathmandu.',
            icon: 'CloudOff',
            colSpan: 'lg:col-span-1',
            accent: 'from-indigo-500/20 to-transparent'
          }
        ]
      },
      ctaBanner: {
        title: 'Ready to hit the trails?',
        description: 'Join thousands of adventurers using NomadNotes to plan smarter, pack lighter, and travel further.',
        backgroundImage: 'https://images.unsplash.com/photo-1522199710521-72d69614c702?w=1920&q=80',
        ctaPrimary: { text: 'Create Free Account', link: '/register' },
        ctaSecondary: { text: 'Browse Gear', link: '/gear' }
      },
      testimonials: {
        title: 'Trusted by the Community',
        description: "Don't just take our word for it. Here's what fellow trekkers and digital nomads have to say about NomadNotes.",
        items: [
          {
            name: 'Alex Mercer',
            role: 'Everest Base Camp Trekker',
            rating: 5,
            text: 'NomadNotes is a game-changer for Nepal. I rented a -20°C sleeping bag directly from a local in Thamel using the gear marketplace.',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80'
          },
          {
            name: 'Priya Sharma',
            role: 'Digital Nomad',
            rating: 5,
            text: 'The offline PWA mode is flawless. I could log my daily expenses in tea houses with absolutely no cell service, and it synced perfectly later.',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80'
          },
          {
            name: 'David Chen',
            role: 'Solo Traveler',
            rating: 4.5,
            text: 'Used Travel Match to find a hiking buddy for the Langtang valley trek. The whole experience from planning to packing was seamless.',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'
          }
        ]
      }
    };

    const existingPage = await Page.findOne({ slug: 'home' });
    
    if (existingPage) {
      existingPage.content = homeContent;
      existingPage.isPublished = true;
      await existingPage.save();
      console.log('Home page updated successfully');
    } else {
      await Page.create({
        title: 'Home',
        slug: 'home',
        content: homeContent,
        isPublished: true
      });
      console.log('Home page created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding home page:', error);
    process.exit(1);
  }
};

seedHomePage();
