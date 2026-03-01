const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NomadNotes API',
      version: '2.0.0',
      description: `
# NomadNotes API Documentation

A comprehensive travel planning and social networking platform with advanced features.

## Key Features

### 🗺️ Trip Management
- Create, edit, and manage travel itineraries
- Add destinations, expenses, and packing lists
- Weather integration for trip planning
- Public/private trip visibility

### 🤝 Social & Matching
- Swipe-based user discovery
- Advanced matching algorithm with preferences
- Real-time messaging with read receipts
- Connection management (likes, matches)

### 🎒 Gear Rental Marketplace
- List and rent travel gear
- Booking management with status tracking
- Review and rating system
- Owner analytics dashboard
- Commission-based payment system

### 💰 Wallet & Payments
- eSewa payment integration
- Wallet balance management
- Transaction history
- Automatic commission deduction

### 🔔 Real-time Features
- Socket.IO for instant messaging
- Push notifications via Firebase
- Online/offline status tracking
- Typing indicators

### 📱 Progressive Web App
- Offline mode support
- Background sync
- Push notifications
- Installable on mobile devices

### 🛡️ Admin Features
- User management
- Site settings configuration
- Analytics dashboard
- Dynamic content management

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
API requests are rate-limited to prevent abuse. Contact support for higher limits.

## Support
For issues or questions, contact: support@nomadnotes.com
      `,
      contact: {
        name: 'NomadNotes Team',
        email: 'support@nomadnotes.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.nomadnotes.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /auth/login or /auth/register'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            username: { type: 'string', example: 'johndoe' },
            profilePicture: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg' },
            bio: { type: 'string', example: 'Travel enthusiast exploring the world' },
            location: { type: 'string', example: 'New York, USA' },
            coordinates: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [-73.935242, 40.730610] }
              }
            },
            preferences: {
              type: 'object',
              properties: {
                ageRange: { type: 'object', properties: { min: { type: 'number' }, max: { type: 'number' } } },
                gender: { type: 'string', enum: ['male', 'female', 'other', 'any'] },
                maxDistance: { type: 'number', example: 50 }
              }
            },
            isAdmin: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Nepal Adventure 2024' },
            destination: { type: 'string', example: 'Kathmandu' },
            country: { type: 'string', example: 'Nepal' },
            startDate: { type: 'string', format: 'date', example: '2024-03-15' },
            endDate: { type: 'string', format: 'date', example: '2024-03-25' },
            status: { type: 'string', enum: ['planning', 'traveling', 'completed'], example: 'planning' },
            isPublic: { type: 'boolean', example: false },
            budget: { type: 'number', example: 2500 },
            imageUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/trip.jpg' },
            coordinates: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [85.3240, 27.7172] }
              }
            },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Expense: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            item: { type: 'string', example: 'Hotel Booking' },
            amount: { type: 'number', example: 150.50 },
            category: { type: 'string', enum: ['accommodation', 'food', 'transportation', 'activities', 'shopping', 'other'], example: 'accommodation' },
            tripId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            date: { type: 'string', format: 'date', example: '2024-03-16' },
            notes: { type: 'string', example: 'Paid via credit card' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        GearRental: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Professional DSLR Camera' },
            description: { type: 'string', example: 'Canon EOS R5 with 24-70mm lens, perfect for travel photography' },
            category: { type: 'string', example: 'Camera & Photography' },
            pricePerDay: { type: 'number', example: 50 },
            depositAmount: { type: 'number', example: 500 },
            location: { type: 'string', example: 'New York, NY' },
            available: { type: 'boolean', example: true },
            images: { type: 'array', items: { type: 'string' }, example: ['https://res.cloudinary.com/demo/image/upload/gear1.jpg'] },
            owner: { type: 'string', example: '507f1f77bcf86cd799439011' },
            rating: { type: 'number', example: 4.5 },
            reviewCount: { type: 'number', example: 12 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        RentalBooking: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            gear: { type: 'string', example: '507f1f77bcf86cd799439011' },
            renter: { type: 'string', example: '507f1f77bcf86cd799439011' },
            startDate: { type: 'string', format: 'date', example: '2024-03-20' },
            endDate: { type: 'string', format: 'date', example: '2024-03-25' },
            totalPrice: { type: 'number', example: 250 },
            depositAmount: { type: 'number', example: 500 },
            status: { type: 'string', enum: ['pending', 'confirmed', 'in-use', 'completed', 'cancelled'], example: 'pending' },
            paymentStatus: { type: 'string', enum: ['pending', 'deposit_paid', 'fully_paid', 'refunded'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Match: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user1: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user2: { type: 'string', example: '507f1f77bcf86cd799439012' },
            matched: { type: 'boolean', example: true },
            user1Liked: { type: 'boolean', example: true },
            user2Liked: { type: 'boolean', example: true },
            matchedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            sender: { type: 'string', example: '507f1f77bcf86cd799439011' },
            receiver: { type: 'string', example: '507f1f77bcf86cd799439012' },
            text: { type: 'string', example: 'Hey! How are you?' },
            image: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/message.jpg' },
            read: { type: 'boolean', example: false },
            readAt: { type: 'string', format: 'date-time' },
            replyTo: { type: 'string', example: '507f1f77bcf86cd799439010' },
            clientSideId: { type: 'string', example: 'msg_1234567890' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            recipient: { type: 'string', example: '507f1f77bcf86cd799439011' },
            sender: { type: 'string', example: '507f1f77bcf86cd799439012' },
            type: { type: 'string', enum: ['match', 'message', 'booking', 'review', 'system'], example: 'match' },
            title: { type: 'string', example: 'New Match!' },
            message: { type: 'string', example: 'You matched with John Doe' },
            link: { type: 'string', example: '/match' },
            read: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            balance: { type: 'number', example: 1250.50 },
            currency: { type: 'string', example: 'NPR' },
            transactions: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        WalletTransaction: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            wallet: { type: 'string', example: '507f1f77bcf86cd799439011' },
            type: { type: 'string', enum: ['credit', 'debit'], example: 'credit' },
            amount: { type: 'number', example: 500 },
            description: { type: 'string', example: 'Gear rental payment' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed'], example: 'completed' },
            paymentMethod: { type: 'string', example: 'esewa' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message describing what went wrong' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Operation completed successfully' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and registration' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Trips', description: 'Trip planning and management' },
      { name: 'Expenses', description: 'Trip expense tracking' },
      { name: 'Destinations', description: 'Trip destinations and itinerary' },
      { name: 'Packing', description: 'Packing list management' },
      { name: 'Weather', description: 'Weather information for destinations' },
      { name: 'Gear Rental', description: 'Gear rental marketplace' },
      { name: 'Bookings', description: 'Rental booking management' },
      { name: 'Matches', description: 'User matching and discovery' },
      { name: 'Messages', description: 'Real-time messaging' },
      { name: 'Notifications', description: 'Push notifications' },
      { name: 'Wallet', description: 'Wallet and payment management' },
      { name: 'Wishlist', description: 'User wishlist for gear' },
      { name: 'Admin', description: 'Admin panel operations' },
      { name: 'Pages', description: 'Dynamic page content management' },
      { name: 'Contact', description: 'Contact form submissions' },
      { name: 'Newsletter', description: 'Newsletter subscriptions' }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
