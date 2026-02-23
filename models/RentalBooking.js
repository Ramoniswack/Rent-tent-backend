const mongoose = require('mongoose');

const rentalBookingSchema = new mongoose.Schema({
  gear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GearRental',
    required: true
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  deposit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'in_use', 'returned', 'inspected', 'completed', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'picked_up', 'in_use', 'returned', 'inspected', 'completed', 'cancelled'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  pickupLocation: {
    type: String,
    required: true
  },
  returnLocation: {
    type: String
  },
  notes: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  }
}, {
  timestamps: true
});

// Index for queries
rentalBookingSchema.index({ renter: 1, status: 1 });
rentalBookingSchema.index({ owner: 1, status: 1 });
rentalBookingSchema.index({ gear: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('RentalBooking', rentalBookingSchema);
