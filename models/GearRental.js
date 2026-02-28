const mongoose = require('mongoose');

const gearRentalSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Backpacks',
      'Tents',
      'Sleeping Bags',
      'Trekking Poles',
      'Camping Gear',
      'Climbing Equipment',
      'Winter Gear',
      'Electronics',
      'Clothing',
      'Other'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['Excellent', 'Good', 'Fair', 'Used']
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NPR',
    enum: ['NPR', 'USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'KRW', 'THB', 'SGD', 'MYR', 'IDR']
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  },
  images: [{
    type: String
  }],
  available: {
    type: Boolean,
    default: true
  },
  specifications: {
    brand: String,
    model: String,
    size: String,
    weight: String,
    color: String
  },
  minimumRentalDays: {
    type: Number,
    default: 1,
    min: 1
  },
  deposit: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRentals: {
    type: Number,
    default: 0
  },
  unavailableDates: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  }],
  // Listing fee tracking
  listingFee: {
    costPerMonth: {
      type: Number,
      default: 100 // NPR per month
    },
    lastChargeDate: {
      type: Date
    },
    nextChargeDate: {
      type: Date
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    autoDeactivateDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index for search and filtering
gearRentalSchema.index({ category: 1, available: 1 });
gearRentalSchema.index({ location: 1 });
gearRentalSchema.index({ pricePerDay: 1 });
gearRentalSchema.index({ owner: 1 });

module.exports = mongoose.model('GearRental', gearRentalSchema);
