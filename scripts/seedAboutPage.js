const mongoose = require('mongoose');
const Page = require('../models/Page');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedAboutPage = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if About page already exists
    const existingPage = await Page.findOne({ slug: 'about' });
    
    if (existingPage) {
      console.log('About page already exists. Updating...');
      
      existingPage.title = 'About Us';
      existingPage.content = {
        hero: {
          badge: 'Our Journey',
          title: 'Built by Nomads, for Nomads.',
          description: [
            "We started NomadNotes on a rainy afternoon in Bali, realizing that while the world is vast, the tools to navigate it as a worker were limited. What began as a shared spreadsheet of Wi-Fi speeds has grown into a global movement.",
            "Today, we're a diverse team of explorers dedicated to making the digital nomad lifestyle sustainable, accessible, and deeply connected for everyone, everywhere."
          ],
          image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80'
        },
        values: [
          {
            icon: 'Compass',
            title: 'Boundless Exploration',
            description: 'We encourage curiosity and the courage to find new paths.'
          },
          {
            icon: 'Users',
            title: 'Radical Community',
            description: "Digital nomadism shouldn't be lonely. We build bridges."
          },
          {
            icon: 'Heart',
            title: 'Sustainability',
            description: 'Respecting the local cultures and environments we visit.'
          }
        ],
        mission: {
          quote: "To empower the global workforce to explore without boundaries.",
          attribution: "NomadNotes Mission"
        },
        team: {
          title: 'Meet the Crew',
          subtitle: 'The explorers, builders, and dreamers working remotely to build the future of travel.',
          members: [
            {
              name: 'Sarah Jenkins',
              role: 'Founder & CEO',
              image: 'https://i.pravatar.cc/400?img=1',
              bio: 'Visionary behind the nomad movement with 10+ years in remote product design.',
              social: {
                website: '#',
                email: '#'
              }
            },
            {
              name: 'Marcus Chen',
              role: 'Head of Product',
              image: 'https://i.pravatar.cc/400?img=13',
              bio: 'Ensuring our tools are as fast as the airport Wi-Fi you rely on.',
              social: {
                website: '#',
                email: '#'
              }
            },
            {
              name: 'Elena Rodriguez',
              role: 'Community Lead',
              image: 'https://i.pravatar.cc/400?img=5',
              bio: 'Connecting thousands of nomads across 120 different countries.',
              social: {
                website: '#',
                email: '#'
              }
            },
            {
              name: 'David Okonjo',
              role: 'Tech Lead',
              image: 'https://i.pravatar.cc/400?img=12',
              bio: 'The architect building our global infrastructure from his van.',
              social: {
                website: '#',
                email: '#'
              }
            }
          ]
        },
        cta: {
          icon: 'Mail',
          title: 'Have a question for the crew?',
          buttonText: 'Get in Touch',
          buttonLink: '/contact'
        }
      };
      existingPage.isPublished = true;
      existingPage.updatedAt = new Date();
      
      await existingPage.save();
      console.log('✅ About page updated successfully!');
    } else {
      console.log('Creating new About page...');
      
      const aboutPage = new Page({
        title: 'About Us',
        slug: 'about',
        content: {
          hero: {
            badge: 'Our Journey',
            title: 'Built by Nomads, for Nomads.',
            description: [
              "We started NomadNotes on a rainy afternoon in Bali, realizing that while the world is vast, the tools to navigate it as a worker were limited. What began as a shared spreadsheet of Wi-Fi speeds has grown into a global movement.",
              "Today, we're a diverse team of explorers dedicated to making the digital nomad lifestyle sustainable, accessible, and deeply connected for everyone, everywhere."
            ],
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80'
          },
          values: [
            {
              icon: 'Compass',
              title: 'Boundless Exploration',
              description: 'We encourage curiosity and the courage to find new paths.'
            },
            {
              icon: 'Users',
              title: 'Radical Community',
              description: "Digital nomadism shouldn't be lonely. We build bridges."
            },
            {
              icon: 'Heart',
              title: 'Sustainability',
              description: 'Respecting the local cultures and environments we visit.'
            }
          ],
          mission: {
            quote: "To empower the global workforce to explore without boundaries.",
            attribution: "NomadNotes Mission"
          },
          team: {
            title: 'Meet the Crew',
            subtitle: 'The explorers, builders, and dreamers working remotely to build the future of travel.',
            members: [
              {
                name: 'Sarah Jenkins',
                role: 'Founder & CEO',
                image: 'https://i.pravatar.cc/400?img=1',
                bio: 'Visionary behind the nomad movement with 10+ years in remote product design.',
                social: {
                  website: '#',
                  email: '#'
                }
              },
              {
                name: 'Marcus Chen',
                role: 'Head of Product',
                image: 'https://i.pravatar.cc/400?img=13',
                bio: 'Ensuring our tools are as fast as the airport Wi-Fi you rely on.',
                social: {
                  website: '#',
                  email: '#'
                }
              },
              {
                name: 'Elena Rodriguez',
                role: 'Community Lead',
                image: 'https://i.pravatar.cc/400?img=5',
                bio: 'Connecting thousands of nomads across 120 different countries.',
                social: {
                  website: '#',
                  email: '#'
                }
              },
              {
                name: 'David Okonjo',
                role: 'Tech Lead',
                image: 'https://i.pravatar.cc/400?img=12',
                bio: 'The architect building our global infrastructure from his van.',
                social: {
                  website: '#',
                  email: '#'
                }
              }
            ]
          },
          cta: {
            icon: 'Mail',
            title: 'Have a question for the crew?',
            buttonText: 'Get in Touch',
            buttonLink: '/contact'
          }
        },
        isPublished: true
      });

      await aboutPage.save();
      console.log('✅ About page created successfully!');
    }

    console.log('\n📄 About Page Details:');
    const page = await Page.findOne({ slug: 'about' });
    console.log('Title:', page.title);
    console.log('Slug:', page.slug);
    console.log('Published:', page.isPublished);
    console.log('Team Members:', page.content.team.members.length);
    console.log('Values:', page.content.values.length);

  } catch (error) {
    console.error('❌ Error seeding About page:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

seedAboutPage();
