const Destination = require('../models/Destination');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

// Helper to check if user has access (owner, collaborator, or public trip for read-only)
const hasAccess = async (tripId, userId) => {
  const trip = await Trip.findOne({
    _id: tripId,
    $or: [
      { userId: userId },
      { 'collaborators.userId': new mongoose.Types.ObjectId(userId) },
      { isPublic: true } // Allow read access for public trips
    ]
  });
  return trip;
};

// Helper to check if user can edit (owner or editor)
const canEdit = async (tripId, userId) => {
  const trip = await Trip.findOne({
    _id: tripId,
    $or: [
      { userId: userId },
      { 
        collaborators: {
          $elemMatch: {
            userId: new mongoose.Types.ObjectId(userId),
            role: 'editor'
          }
        }
      }
    ]
  });
  return trip;
};

// GET /api/trips/:id/destinations - Fetch all destinations for a trip
exports.getDestinations = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify access (owner or collaborator)
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const destinations = await Destination.find({ tripId: id })
      .populate('createdBy', 'name email')
      .sort({ time: 1 });
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips/:id/destinations - Add a destination to a trip
exports.createDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, activity, time, status } = req.body;

    // Verify edit permission (owner or editor)
    const trip = await canEdit(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const destination = new Destination({
      name,
      activity,
      time,
      tripId: id,
      createdBy: req.userId,
      status: status || 'planning' // Default to planning if not provided
    });

    await destination.save();
    
    // Populate createdBy before sending response
    await destination.populate('createdBy', 'name email');
    
    res.status(201).json(destination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/destinations/:id - Remove a specific destination
exports.deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;

    // Find destination and verify edit permission
    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    const trip = await canEdit(destination.tripId, req.userId);
    if (!trip) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Destination.findByIdAndDelete(id);
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/destinations/:id - Update destination status
exports.updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, name, activity, time } = req.body;

    // Validate status if provided
    if (status && !['planning', 'traveling', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Find destination and verify edit permission
    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    const trip = await canEdit(destination.tripId, req.userId);
    if (!trip) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update fields
    if (status) destination.status = status;
    if (name) destination.name = name;
    if (activity) destination.activity = activity;
    if (time) destination.time = time;
    
    await destination.save();
    
    // Populate createdBy before sending response
    await destination.populate('createdBy', 'name email');
    
    res.json(destination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
