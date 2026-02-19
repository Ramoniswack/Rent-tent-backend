const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NomadNotes API',
      version: '1.0.0',
      description: 'API documentation for NomadNotes - A comprehensive travel planning and itinerary management platform',
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
          description: 'Enter your JWT token'
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
            profilePicture: { type: 'string', example: 'https://example.com/avatar.jpg' },
            bio: { type: 'string', example: 'Travel enthusiast' },
            location: { type: 'string', example: 'New York, USA' }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Nepal Adventure' },
            destination: { type: 'string', example: 'Kathmandu' },
            country: { type: 'string', example: 'Nepal' },
            startDate: { type: 'string', format: 'date', example: '2024-03-15' },
            endDate: { type: 'string', format: 'date', example: '2024-03-25' },
            status: { type: 'string', enum: ['planning', 'traveling', 'completed'], example: 'planning' },
            isPublic: { type: 'boolean', example: false },
            budget: { type: 'number', example: 2500 },
            imageUrl: { type: 'string', example: 'https://example.com/trip.jpg' }
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
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        GearRental: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Professional Camera' },
            description: { type: 'string', example: 'Canon EOS R5 with lenses' },
            category: { type: 'string', example: 'Electronics' },
            pricePerDay: { type: 'number', example: 50 },
            location: { type: 'string', example: 'New York' },
            available: { type: 'boolean', example: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
