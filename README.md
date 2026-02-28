# NomadNotes Backend API

Node.js/Express backend for the NomadNotes travel platform with real-time features, email notifications, and comprehensive API endpoints.

## Latest Features ✨

### Newsletter System
- Newsletter subscription management
- Email validation and duplicate handling
- Welcome email automation
- Admin endpoints for subscriber management
- Subscription statistics

### Email Notifications
- Welcome emails on registration
- Gear rental order notifications
- Booking confirmation emails
- Match notification emails
- Newsletter welcome emails
- Beautiful HTML templates with Lucide SVG icons

### Footer Menu Management
- Dynamic footer menu configuration
- Product and Company menu sections
- Admin API for menu management
- Real-time updates

## ✅ Status
- **Server**: Running on http://localhost:5000
- **MongoDB**: Connected successfully
- **Health Check**: http://localhost:5000/api/health
- **API Documentation**: http://localhost:5000/api-docs (Swagger)

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nomadnotes
JWT_SECRET=your_jwt_secret_key_here

# Weather API
OPENWEATHER_API_KEY=your_openweathermap_api_key_here

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_FROM_NAME=NomadNotes

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm run dev  # Development with nodemon
npm start    # Production
```

---

## API Endpoints

### 🔓 Public Endpoints (No Authentication Required)

#### Authentication
- **POST** `/api/auth/register` - Register new user
  - Body: `{ name, email, password }`
  - Returns: `{ token, user: { id, name, email } }`

- **POST** `/api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user: { id, name, email } }`

---

### 🔒 Protected Endpoints (Authentication Required)

> **Note**: All protected endpoints require `Authorization: Bearer <token>` header

---

### 👤 User Profile

- **GET** `/api/user/profile` - Get current user profile
  - Returns: `{ id, name, email, username, profilePicture }`

- **PATCH** `/api/user/profile` - Update user profile
  - Body: `{ name?, username?, profilePicture? }`
  - Returns: Updated user object

---

### 🗺️ Trips

#### Trip Management

- **GET** `/api/trips` - Get all trips for authenticated user
  - Returns: Array of trips (owned + collaborated)
  - Includes: Owner and collaborator details

- **GET** `/api/trips/public` - Get all public trips (excluding user's own)
  - Returns: Array of public trips created by other users

- **GET** `/api/trips/:id` - Get single trip by ID
  - Returns: Trip details with access information
  - Access: Owner, accepted collaborators, or public trips

- **POST** `/api/trips` - Create new trip
  - Body: `{ title, startDate, endDate, destination?, country?, currency?, imageUrl?, isPublic? }`
  - Returns: Created trip object

- **PATCH** `/api/trips/:id` - Update trip details
  - Body: `{ title?, startDate?, endDate?, status?, destination?, lat?, lng? }`
  - Access: Owner only
  - Returns: Updated trip object

- **DELETE** `/api/trips/:id` - Delete trip (cascade delete)
  - Access: Owner only
  - Deletes: Trip + all destinations + all expenses
  - Returns: Success message

- **POST** `/api/trips/:id/share` - Toggle public/private status
  - Access: Owner only
  - Returns: `{ isPublic, shareableUrl?, message }`

#### Collaboration

- **POST** `/api/trips/:id/invite` - Invite user to trip
  - Body: `{ username, role: 'viewer' | 'editor' }`
  - Access: Owner only
  - Returns: Updated trip with collaborators

- **POST** `/api/trips/:id/request-join` - Request to join public trip
  - Access: Any authenticated user (not owner/collaborator)
  - Returns: Success message

- **POST** `/api/trips/:id/accept-request/:userId` - Accept join request
  - Access: Owner only
  - Returns: Updated trip with accepted collaborator

- **POST** `/api/trips/:id/reject-request/:userId` - Reject join request
  - Access: Owner only
  - Returns: Success message

- **DELETE** `/api/trips/:id/collaborators/:userId` - Remove collaborator
  - Access: Owner (to remove others) or self (to leave trip)
  - Returns: Success message

- **GET** `/api/trips/search/users` - Search users by username
  - Query: `?username=<search_term>`
  - Returns: Array of matching users (max 10)

#### Activity Log

- **GET** `/api/trips/:id/activities` - Get trip activity log
  - Access: Owner or collaborators
  - Returns: Array of activity records (last 50)

---

### 📍 Destinations (Itinerary Stops)

- **GET** `/api/trips/:id/destinations` - Get all destinations for trip
  - Access: Owner or collaborators
  - Returns: Array of destinations with status

- **POST** `/api/trips/:id/destinations` - Add destination to trip
  - Body: `{ name, activity, time, status? }`
  - Access: Owner or editor collaborators
  - Returns: Created destination object

- **PATCH** `/api/destinations/:id` - Update destination
  - Body: `{ name?, activity?, time?, status? }`
  - Status: `'planning' | 'traveling' | 'completed'`
  - Access: Owner or editor collaborators
  - Returns: Updated destination object

- **DELETE** `/api/destinations/:id` - Delete destination
  - Access: Owner or editor collaborators
  - Returns: Success message

---

### 💰 Expenses

- **GET** `/api/trips/:id/expenses` - Get all expenses for trip
  - Access: Owner or collaborators
  - Returns: Array of expense records

- **POST** `/api/trips/:id/expenses` - Add expense to trip
  - Body: `{ item, amount, category, date? }`
  - Categories: `'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'other'`
  - Access: Owner or editor collaborators
  - Returns: Created expense object

- **GET** `/api/trips/:id/expenses/summary` - Get expense summary
  - Access: Owner or collaborators
  - Returns: `{ total, byCategory: { category: amount } }`

---

### 🌤️ Weather

- **GET** `/api/weather/:city` - Get weather forecast for city
  - Access: Authenticated users
  - Returns: `{ city, temperature, condition, forecast: [...] }`
  - Note: Requires OpenWeatherMap API key

---

### 📤 Upload

- **POST** `/api/upload` - Upload image to Cloudinary
  - Content-Type: `multipart/form-data`
  - Field: `image` (file)
  - Max size: 5MB
  - Allowed: Image files only
  - Returns: `{ url: 'cloudinary_url' }`

---

### 📧 Contact & Newsletter

#### Contact Form
- **POST** `/api/contact` - Send contact form email
  - Body: `{ name, email, subject, message }`
  - Returns: `{ success: true, message: 'Email sent successfully' }`

#### Newsletter (Public)
- **POST** `/api/newsletter/subscribe` - Subscribe to newsletter
  - Body: `{ email, source?: 'footer' | 'popup' | 'checkout' | 'other' }`
  - Returns: `{ success: true, message: 'Successfully subscribed!', subscription }`
  - Sends welcome email automatically

- **POST** `/api/newsletter/unsubscribe` - Unsubscribe from newsletter
  - Body: `{ email }`
  - Returns: `{ success: true, message: 'Successfully unsubscribed' }`

#### Newsletter (Admin Only)
- **GET** `/api/newsletter/subscribers` - Get all subscribers
  - Query: `?active=true&page=1&limit=50`
  - Returns: `{ success: true, subscribers: [...], pagination: {...} }`

- **GET** `/api/newsletter/stats` - Get newsletter statistics
  - Returns: `{ success: true, stats: { totalSubscribers, totalUnsubscribed, todaySubscribers, sourceBreakdown } }`

---

### ⚙️ Site Settings & Configuration

#### Footer Menus (Admin Only)
- **GET** `/api/profile-field-options` - Get all configuration options
  - Returns: `{ footerProductMenu: [...], footerCompanyMenu: [...], ... }`

- **PUT** `/api/profile-field-options/footerProductMenu` - Update product menu
  - Body: `{ menuItems: [{ label, url }, ...] }`
  - Returns: `{ message: 'Updated successfully', options }`

- **PUT** `/api/profile-field-options/footerCompanyMenu` - Update company menu
  - Body: `{ menuItems: [{ label, url }, ...] }`
  - Returns: `{ message: 'Updated successfully', options }`

#### Site Settings (Admin Only)
- **GET** `/api/site-settings` - Get all site settings
  - Returns: `{ serviceFeePercentage, platformName, supportEmail, logoText, ... }`

- **PUT** `/api/admin/site-settings/:key` - Update specific setting
  - Body: `{ value: <new_value> }`
  - Returns: `{ message: 'Setting updated', setting }`

---

## Data Models

### Trip
```javascript
{
  _id: ObjectId,
  title: String,
  startDate: Date,
  endDate: Date,
  userId: ObjectId (ref: User),
  collaborators: [{
    userId: ObjectId (ref: User),
    role: 'viewer' | 'editor',
    status: 'pending' | 'accepted',
    invitedAt: Date
  }],
  isPublic: Boolean,
  status: 'planning' | 'traveling' | 'completed',
  destination: String,
  country: String,
  currency: String,
  imageUrl: String,
  lat: Number,
  lng: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Destination
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: Trip),
  name: String,
  activity: String,
  time: Date,
  status: 'planning' | 'traveling' | 'completed',
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Expense
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: Trip),
  item: String,
  amount: Number,
  category: String,
  date: Date,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  username: String (unique),
  password: String (hashed),
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Activity
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: Trip),
  userId: ObjectId (ref: User),
  action: String,
  details: String,
  metadata: Object,
  createdAt: Date
}
```

---

## Error Responses

All endpoints return errors in the following format:
```javascript
{
  error: "Error message description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`

Both endpoints return a token in the response.

### Using the Token
Include the token in the Authorization header for all protected endpoints:
```
Authorization: Bearer <your_token_here>
```

---

## Development

### Running Tests
```bash
npm test
```

### Database Reset
```bash
# Drop all collections
mongo nomadnotes --eval "db.dropDatabase()"
```

### Logs
The server logs all requests and errors to the console in development mode.

---

## Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Weather API**: OpenWeatherMap
- **Security**: bcryptjs, cors, helmet
- **Real-time**: Socket.IO (messaging, notifications, calls)
- **WebRTC**: Metered.ca (TURN/STUN servers)
- **Push Notifications**: Firebase Admin SDK

---

## Troubleshooting

### Server won't start
1. Check if MongoDB is running and accessible
2. Verify all environment variables are set in `.env`
3. Run `npm install` to ensure all dependencies are installed
4. Check if port 5000 is already in use

### MongoDB connection error
- Verify `MONGODB_URI` in `.env` is correct
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your IP (if using Atlas)

### Authentication issues
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration (tokens expire after 30 days)
- Ensure Authorization header format: `Bearer <token>`

### File upload fails
- Verify Cloudinary credentials in `.env`
- Check file size (max 5MB)
- Ensure file is an image format

### Socket.IO connection issues
- Check CORS configuration in `server.js`
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check browser console for WebSocket errors

### Quick Health Check
Run this command to test the backend:
```bash
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Backend is healthy'); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
```

---

## License

MIT
