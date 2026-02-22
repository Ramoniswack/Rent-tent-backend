const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String
  },
  coverPhoto: {
    type: String
  },
  bio: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  // Geospatial location for discovery (GeoJSON format)
  geoLocation: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },
  age: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say', '']
  },
  dateOfBirth: {
    type: String,
    trim: true
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  upcomingTrips: {
    type: [String],
    default: []
  },
  preferences: {
    language: { type: String, default: 'English (US)' },
    currency: { type: String, default: 'USD ($)' },
    emailNotifications: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: true },
    shareLocation: { type: Boolean, default: false }
  },
  matchPreferences: {
    ageRange: { type: [Number], default: [18, 60] },
    travelStyles: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    locationRange: { type: Number, default: 500 },
    genders: { type: [String], default: [] }
  },
  languages: {
    type: [String],
    default: []
  },
  interests: {
    type: [String],
    default: []
  },
  travelStyle: {
    type: String,
    trim: true
  },
  billingAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  fcmTokens: [{
    type: String
  }],
  webPushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  }],
  notificationPreferences: {
    messages: { type: Boolean, default: true },
    bookings: { type: Boolean, default: true },
    matches: { type: Boolean, default: true },
    tripUpdates: { type: Boolean, default: true }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
userSchema.index({ 'geoLocation': '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
