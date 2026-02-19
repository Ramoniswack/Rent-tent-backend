const Trip = require('../models/Trip');
const Destination = require('../models/Destination');
const Expense = require('../models/Expense');
const Activity = require('../models/Activity');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to check if user has access to trip
const hasAccess = async (tripId, userId) => {
  const trip = await Trip.findOne({
    _id: tripId,
    $or: [
      { userId: userId },
      { 'collaborators.userId': new mongoose.Types.ObjectId(userId) }
    ]
  });
  return trip;
};

// Helper function to check if user can edit trip
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

// Helper function to log activity
const logActivity = async (tripId, userId, action, details, metadata = {}) => {
  try {
    await Activity.create({
      tripId,
      userId,
      action,
      details,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// GET /api/trips - Fetch all trips for authenticated user
exports.getAllTrips = async (req, res) => {
  try {
    // Find trips where user is owner or collaborator
    const trips = await Trip.find({
      $or: [
        { userId: req.userId },
        { 'collaborators.userId': req.userId }
      ]
    })
    .populate('userId', 'name email profilePicture')
    .populate('collaborators.userId', 'name email username profilePicture')
    .sort({ startDate: -1 });
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/trips/public - Fetch all public trips (excluding current user's trips)
exports.getPublicTrips = async (req, res) => {
  try {
    // Find public trips created by other users
    const trips = await Trip.find({
      isPublic: true,
      userId: { $ne: req.userId }
    })
    .populate('userId', 'name email profilePicture')
    .populate('collaborators.userId', 'name email username profilePicture')
    .sort({ startDate: -1 });
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/trips/:id - Fetch a single trip by ID
exports.getTrip = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find trip - allow access if owner, collaborator, or public trip
    const trip = await Trip.findById(id)
      .populate('userId', 'name email profilePicture')
      .populate('collaborators.userId', 'name email username profilePicture');
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check access: owner, accepted collaborator, or public trip
    const isOwner = trip.userId._id.toString() === req.userId.toString();
    const isAcceptedCollaborator = trip.collaborators.some(
      c => c.userId._id.toString() === req.userId.toString() && c.status === 'accepted'
    );
    const isPublic = trip.isPublic;

    if (!isOwner && !isAcceptedCollaborator && !isPublic) {
      return res.status(403).json({ error: 'Unauthorized to view this trip' });
    }

    // Check if user has pending request
    const hasPendingRequest = trip.collaborators.some(
      c => c.userId._id.toString() === req.userId.toString() && c.status === 'pending'
    );

    // For public trips where user is not owner/collaborator, return limited info
    if (isPublic && !isOwner && !isAcceptedCollaborator) {
      // Count only accepted collaborators for security
      const acceptedCollaboratorsCount = trip.collaborators.filter(c => c.status === 'accepted').length;
      
      return res.json({
        _id: trip._id,
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        destination: trip.destination,
        country: trip.country,
        imageUrl: trip.imageUrl,
        status: trip.status,
        isPublic: trip.isPublic,
        userId: {
          _id: trip.userId._id,
          name: trip.userId.name,
          profilePicture: trip.userId.profilePicture
        },
        collaborators: [], // Don't expose collaborator details for security
        collaboratorsCount: acceptedCollaboratorsCount,
        userAccess: {
          isOwner: false,
          isAcceptedCollaborator: false,
          hasPendingRequest,
          canEdit: false
        }
      });
    }

    // Return full trip with access info for owner/collaborators
    res.json({
      ...trip.toObject(),
      userAccess: {
        isOwner,
        isAcceptedCollaborator,
        hasPendingRequest,
        canEdit: isOwner || isAcceptedCollaborator
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips - Create a new trip
exports.createTrip = async (req, res) => {
  try {
    const { title, startDate, endDate, destination, country, currency, imageUrl, isPublic } = req.body;

    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const trip = new Trip({
      title,
      startDate,
      endDate,
      destination: destination || 'Nepal',
      country: country || 'Nepal',
      currency: currency || 'NPR',
      imageUrl: imageUrl,
      isPublic: isPublic || false,
      userId: req.userId
    });

    await trip.save();
    
    // Log activity
    await logActivity(
      trip._id,
      req.userId,
      'created_trip',
      `Created trip "${title}"`,
      { title, startDate, endDate, destination, country, currency, isPublic }
    );
    
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/trips/:id - Update trip details
exports.updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startDate, endDate, status, destination, lat, lng } = req.body;

    // Find trip and verify ownership
    const trip = await Trip.findOne({ _id: id, userId: req.userId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Validate dates if both are provided
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Update fields
    if (title) trip.title = title;
    if (startDate) trip.startDate = startDate;
    if (endDate) trip.endDate = endDate;
    if (status) trip.status = status;
    if (destination) trip.destination = destination;
    if (lat !== undefined) trip.lat = lat;
    if (lng !== undefined) trip.lng = lng;

    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/trips/:id - Cascade delete trip and related data
exports.deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // Find trip and verify ownership
    const trip = await Trip.findOne({ _id: id, userId: req.userId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Cascade delete: Remove all destinations and expenses for this trip
    await Destination.deleteMany({ tripId: id });
    await Expense.deleteMany({ tripId: id });
    await Trip.findByIdAndDelete(id);

    res.json({ message: 'Trip and related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips/:id/share - Toggle public sharing and return shareable URL
exports.shareTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // Find trip and verify ownership
    const trip = await Trip.findOne({ _id: id, userId: req.userId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Toggle isPublic status
    trip.isPublic = !trip.isPublic;
    await trip.save();

    // Generate shareable URL (adjust domain as needed)
    const shareableUrl = trip.isPublic 
      ? `${req.protocol}://${req.get('host')}/shared/trips/${trip._id}`
      : null;

    res.json({
      isPublic: trip.isPublic,
      shareableUrl,
      message: trip.isPublic ? 'Trip is now public' : 'Trip is now private'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// POST /api/trips/:id/invite - Invite a user to collaborate on a trip
exports.inviteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role = 'editor' } = req.body;

    // Only trip owner can invite users
    const trip = await Trip.findOne({ _id: id, userId: req.userId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Find user by username
    const userToInvite = await User.findOne({ username });
    if (!userToInvite) {
      return res.status(404).json({ error: 'User not found with that username' });
    }

    // Check if user is already a collaborator
    const alreadyCollaborator = trip.collaborators.some(
      c => c.userId.toString() === userToInvite._id.toString()
    );
    if (alreadyCollaborator) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Check if trying to invite self
    if (userToInvite._id.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot invite yourself' });
    }

    // Add collaborator
    trip.collaborators.push({
      userId: userToInvite._id,
      role,
      invitedAt: new Date()
    });

    await trip.save();

    // Log activity
    await logActivity(
      id,
      req.userId,
      'invited_user',
      `Invited ${userToInvite.name} as ${role}`,
      { invitedUserId: userToInvite._id, role }
    );

    // Populate and return
    await trip.populate('collaborators.userId', 'name email username');
    
    res.json({
      message: 'User invited successfully',
      trip
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/trips/:id/collaborators/:userId - Remove a collaborator
exports.removeCollaborator = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Find the trip
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check authorization: either trip owner OR the user removing themselves
    const isOwner = trip.userId.toString() === req.userId.toString();
    const isRemovingSelf = userId === req.userId.toString();

    if (!isOwner && !isRemovingSelf) {
      return res.status(403).json({ error: 'Unauthorized to remove this collaborator' });
    }

    // Remove collaborator
    const collaborator = trip.collaborators.find(
      c => c.userId.toString() === userId
    );
    
    if (!collaborator) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    trip.collaborators = trip.collaborators.filter(
      c => c.userId.toString() !== userId
    );

    await trip.save();

    // Log activity
    const removedUser = await User.findById(userId);
    const actionType = isRemovingSelf ? 'left_trip' : 'removed_user';
    const actionDetails = isRemovingSelf 
      ? `${removedUser?.name || 'User'} left the trip`
      : `Removed ${removedUser?.name || 'user'} from trip`;
    
    await logActivity(
      id,
      req.userId,
      actionType,
      actionDetails,
      { removedUserId: userId }
    );

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/trips/:id/activities - Get activity log for a trip
exports.getActivities = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify access
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Get activities
    const activities = await Activity.find({ tripId: id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/search - Search users by username (for inviting)
exports.searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.userId } // Exclude current user
    })
    .select('name email username profilePicture')
    .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips/:id/request-join - Request to join a public trip
exports.requestJoinTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the public trip
    const trip = await Trip.findOne({ _id: id, isPublic: true });
    if (!trip) {
      return res.status(404).json({ error: 'Public trip not found' });
    }

    // Check if user is already owner
    if (trip.userId.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'You are the owner of this trip' });
    }

    // Check if user already has a request or is already a collaborator
    const existingCollaborator = trip.collaborators.find(
      c => c.userId.toString() === req.userId.toString()
    );
    
    if (existingCollaborator) {
      if (existingCollaborator.status === 'pending') {
        return res.status(400).json({ error: 'You already have a pending request' });
      }
      return res.status(400).json({ error: 'You are already a collaborator' });
    }

    // Add join request
    trip.collaborators.push({
      userId: req.userId,
      role: 'viewer',
      status: 'pending',
      invitedAt: new Date()
    });

    await trip.save();

    // Log activity
    const user = await User.findById(req.userId);
    await logActivity(
      id,
      req.userId,
      'requested_join',
      `${user?.name || 'User'} requested to join the trip`,
      { requestedUserId: req.userId }
    );

    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips/:id/accept-request/:userId - Accept a join request
exports.acceptJoinRequest = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Only trip owner can accept requests
    const trip = await Trip.findOne({ _id: id, userId: req.userId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Find the pending request
    const collaborator = trip.collaborators.find(
      c => c.userId.toString() === userId && c.status === 'pending'
    );

    if (!collaborator) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    // Accept the request
    collaborator.status = 'accepted';
    await trip.save();

    // Log activity
    const user = await User.findById(userId);
    await logActivity(
      id,
      req.userId,
      'accepted_join',
      `Accepted ${user?.name || 'user'}'s join request`,
      { acceptedUserId: userId }
    );

    // Populate and return
    await trip.populate('collaborators.userId', 'name email username profilePicture');
    
    res.json({
      message: 'Join request accepted',
      trip
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips/:id/reject-request/:userId - Reject a join request
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Only trip owner can reject requests
    const trip = await Trip.findOne({ _id: id, userId: req.userId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Remove the pending request
    trip.collaborators = trip.collaborators.filter(
      c => !(c.userId.toString() === userId && c.status === 'pending')
    );

    await trip.save();

    // Log activity
    const user = await User.findById(userId);
    await logActivity(
      id,
      req.userId,
      'rejected_join',
      `Rejected ${user?.name || 'user'}'s join request`,
      { rejectedUserId: userId }
    );

    res.json({ message: 'Join request rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
