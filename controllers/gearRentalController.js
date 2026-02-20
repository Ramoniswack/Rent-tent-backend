const GearRental = require('../models/GearRental');
const RentalBooking = require('../models/RentalBooking');
const User = require('../models/User');

// Get all gear rentals with filters
exports.getAllGear = async (req, res) => {
  try {
    const { category, location, minPrice, maxPrice, available, search } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (available !== undefined) query.available = available === 'true';
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const gear = await GearRental.find(query)
      .populate('owner', 'name email profilePicture username location')
      .sort({ createdAt: -1 });

    res.json(gear);
  } catch (error) {
    console.error('Error fetching gear:', error);
    res.status(500).json({ error: 'Failed to fetch gear' });
  }
};

// Get single gear by ID
exports.getGearById = async (req, res) => {
  try {
    const { id } = req.params;

    const gear = await GearRental.findById(id)
      .populate('owner', 'name email profilePicture username location bio');

    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    // Increment views
    gear.views += 1;
    await gear.save();

    res.json(gear);
  } catch (error) {
    console.error('Error fetching gear:', error);
    res.status(500).json({ error: 'Failed to fetch gear' });
  }
};

// Get user's listed gear
exports.getMyGear = async (req, res) => {
  try {
    const userId = req.userId;

    const gear = await GearRental.find({ owner: userId })
      .sort({ createdAt: -1 });

    res.json(gear);
  } catch (error) {
    console.error('Error fetching my gear:', error);
    res.status(500).json({ error: 'Failed to fetch gear' });
  }
};

// Create new gear listing
exports.createGear = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      title,
      description,
      category,
      condition,
      pricePerDay,
      currency,
      location,
      images,
      specifications,
      minimumRentalDays,
      deposit
    } = req.body;

    if (!title || !description || !category || !condition || !pricePerDay || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const gear = await GearRental.create({
      owner: userId,
      title,
      description,
      category,
      condition,
      pricePerDay,
      currency: currency || 'NPR',
      location,
      images: images || [],
      specifications: specifications || {},
      minimumRentalDays: minimumRentalDays || 1,
      deposit: deposit || 0
    });

    const populatedGear = await GearRental.findById(gear._id)
      .populate('owner', 'name email profilePicture');

    res.status(201).json(populatedGear);
  } catch (error) {
    console.error('Error creating gear:', error);
    res.status(500).json({ error: 'Failed to create gear listing' });
  }
};

// Update gear listing
exports.updateGear = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const gear = await GearRental.findById(id);

    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    if (gear.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'condition', 'pricePerDay',
      'currency', 'location', 'images', 'available', 'specifications',
      'minimumRentalDays', 'deposit'
    ];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        gear[key] = req.body[key];
      }
    });

    await gear.save();

    const populatedGear = await GearRental.findById(gear._id)
      .populate('owner', 'name email profilePicture');

    res.json(populatedGear);
  } catch (error) {
    console.error('Error updating gear:', error);
    res.status(500).json({ error: 'Failed to update gear' });
  }
};

// Delete gear listing
exports.deleteGear = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const gear = await GearRental.findById(id);

    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    if (gear.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check for active bookings
    const activeBookings = await RentalBooking.countDocuments({
      gear: id,
      status: { $in: ['pending', 'confirmed', 'active'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete gear with active bookings' 
      });
    }

    await GearRental.findByIdAndDelete(id);

    res.json({ message: 'Gear deleted successfully' });
  } catch (error) {
    console.error('Error deleting gear:', error);
    res.status(500).json({ error: 'Failed to delete gear' });
  }
};

// Create rental booking
exports.createBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const { gearId, startDate, endDate, pickupLocation, notes } = req.body;

    if (!gearId || !startDate || !endDate || !pickupLocation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const gear = await GearRental.findById(gearId);

    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    if (!gear.available) {
      return res.status(400).json({ error: 'Gear is not available' });
    }

    if (gear.owner.toString() === userId) {
      return res.status(400).json({ error: 'Cannot rent your own gear' });
    }

    // Calculate total days and price
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (totalDays < gear.minimumRentalDays) {
      return res.status(400).json({ 
        error: `Minimum rental period is ${gear.minimumRentalDays} days` 
      });
    }

    const totalPrice = totalDays * gear.pricePerDay;

    // Check for conflicting bookings
    const conflictingBooking = await RentalBooking.findOne({
      gear: gearId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        error: 'Gear is already booked for these dates' 
      });
    }

    // Check for manually blocked dates
    if (gear.unavailableDates && gear.unavailableDates.length > 0) {
      const hasBlockedDate = gear.unavailableDates.some(range => {
        const rangeStart = new Date(range.startDate);
        const rangeEnd = new Date(range.endDate);
        // Check if booking dates overlap with blocked dates
        return (start <= rangeEnd && end >= rangeStart);
      });

      if (hasBlockedDate) {
        return res.status(400).json({ 
          error: 'Gear is not available for these dates' 
        });
      }
    }

    const booking = await RentalBooking.create({
      gear: gearId,
      renter: userId,
      owner: gear.owner,
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      deposit: gear.deposit,
      pickupLocation,
      notes: notes || ''
    });

    const populatedBooking = await RentalBooking.findById(booking._id)
      .populate('gear')
      .populate('renter', 'name email profilePicture')
      .populate('owner', 'name email profilePicture');

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Get user's bookings (as renter)
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.userId;

    const bookings = await RentalBooking.find({ renter: userId })
      .populate('gear')
      .populate('owner', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Get bookings for user's gear (as owner)
exports.getGearBookings = async (req, res) => {
  try {
    const userId = req.userId;

    const bookings = await RentalBooking.find({ owner: userId })
      .populate('gear')
      .populate('renter', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching gear bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    const booking = await RentalBooking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only owner can confirm/cancel, renter can cancel
    if (booking.owner.toString() !== userId && booking.renter.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    booking.status = status;
    await booking.save();

    // Update gear total rentals if completed
    if (status === 'completed') {
      await GearRental.findByIdAndUpdate(booking.gear, {
        $inc: { totalRentals: 1 }
      });
    }

    const populatedBooking = await RentalBooking.findById(booking._id)
      .populate('gear')
      .populate('renter', 'name email profilePicture')
      .populate('owner', 'name email profilePicture');

    res.json(populatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// Add review and rating
exports.addReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, review } = req.body;

    const booking = await RentalBooking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.renter.toString() !== userId) {
      return res.status(403).json({ error: 'Only renter can add review' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    // Update gear average rating
    const allRatings = await RentalBooking.find({
      gear: booking.gear,
      rating: { $exists: true }
    }).select('rating');

    if (allRatings.length > 0) {
      const avgRating = allRatings.reduce((sum, b) => sum + b.rating, 0) / allRatings.length;
      await GearRental.findByIdAndUpdate(booking.gear, {
        rating: Math.round(avgRating * 10) / 10
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
};

// Get reviews for a gear item
exports.getGearReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await RentalBooking.find({
      gear: id,
      rating: { $exists: true },
      review: { $exists: true }
    })
      .populate('renter', 'name profilePicture')
      .select('rating review renter createdAt')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Get unavailable dates for a gear item
exports.getUnavailableDates = async (req, res) => {
  try {
    const { id } = req.params;

    // Find all confirmed and active bookings for this gear
    const bookings = await RentalBooking.find({
      gear: id,
      status: { $in: ['confirmed', 'active'] }
    }).select('startDate endDate');

    // Get manually blocked dates from gear
    const gear = await GearRental.findById(id).select('unavailableDates');
    
    const unavailableDates = bookings.map(booking => ({
      startDate: booking.startDate,
      endDate: booking.endDate,
      type: 'booked'
    }));

    // Add manually blocked dates if they exist
    if (gear && gear.unavailableDates) {
      gear.unavailableDates.forEach(range => {
        unavailableDates.push({
          startDate: range.startDate,
          endDate: range.endDate,
          type: 'blocked'
        });
      });
    }

    res.json(unavailableDates);
  } catch (error) {
    console.error('Error fetching unavailable dates:', error);
    res.status(500).json({ error: 'Failed to fetch unavailable dates' });
  }
};

// Manage availability calendar (block/unblock dates)
exports.manageAvailability = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { startDate, endDate, action } = req.body; // action: 'block' or 'unblock'

    if (!startDate || !endDate || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const gear = await GearRental.findById(id);

    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    if (gear.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (action === 'block') {
      // Add date range to unavailable dates
      gear.unavailableDates = gear.unavailableDates || [];
      gear.unavailableDates.push({ startDate: start, endDate: end });
    } else if (action === 'unblock') {
      // Remove date range from unavailable dates
      gear.unavailableDates = (gear.unavailableDates || []).filter(range => {
        const rangeStart = new Date(range.startDate);
        const rangeEnd = new Date(range.endDate);
        // Remove if dates match
        return !(rangeStart.getTime() === start.getTime() && rangeEnd.getTime() === end.getTime());
      });
    }

    await gear.save();

    res.json({ message: `Dates ${action}ed successfully`, unavailableDates: gear.unavailableDates });
  } catch (error) {
    console.error('Error managing availability:', error);
    res.status(500).json({ error: 'Failed to manage availability' });
  }
};
