const PackingItem = require('../models/PackingItem');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

// Helper to check if user has access to trip
const hasAccess = async (tripId, userId) => {
  const trip = await Trip.findOne({
    _id: tripId,
    $or: [
      { userId: userId },
      { 
        collaborators: {
          $elemMatch: {
            userId: new mongoose.Types.ObjectId(userId),
            status: 'accepted'
          }
        }
      }
    ]
  });
  return trip;
};

// GET /api/trips/:id/packing - Get all packing items for a trip
exports.getPackingList = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify access
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const items = await PackingItem.find({ tripId: id })
      .populate('createdBy', 'name email profilePicture username')
      .populate('packedBy', 'name email profilePicture username')
      .sort({ category: 1, createdAt: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips/:id/packing - Add packing item
exports.addPackingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, isEssential, notes } = req.body;

    // Verify access
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const item = new PackingItem({
      tripId: id,
      name,
      category: category || 'other',
      quantity: quantity || 1,
      isEssential: isEssential || false,
      notes,
      createdBy: req.userId
    });

    await item.save();
    await item.populate('createdBy', 'name email');

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/packing/:id - Update packing item
exports.updatePackingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, isPacked, isEssential, notes } = req.body;

    const item = await PackingItem.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Packing item not found' });
    }

    // Verify access to trip
    const trip = await hasAccess(item.tripId, req.userId);
    if (!trip) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update fields
    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (quantity !== undefined) item.quantity = quantity;
    if (isPacked !== undefined) {
      item.isPacked = isPacked;
      if (isPacked) {
        item.packedBy = req.userId;
        item.packedAt = new Date();
      } else {
        item.packedBy = null;
        item.packedAt = null;
      }
    }
    if (isEssential !== undefined) item.isEssential = isEssential;
    if (notes !== undefined) item.notes = notes;

    await item.save();
    await item.populate('createdBy', 'name email profilePicture username');
    await item.populate('packedBy', 'name email profilePicture username');

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/packing/:id - Delete packing item
exports.deletePackingItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await PackingItem.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Packing item not found' });
    }

    // Verify access to trip
    const trip = await hasAccess(item.tripId, req.userId);
    if (!trip) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await PackingItem.findByIdAndDelete(id);
    res.json({ message: 'Packing item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/trips/:id/packing/template - Add template items
exports.addTemplateItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { template } = req.body; // 'trekking', 'city', 'camping'

    // Verify access
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const templates = {
      trekking: [
        // Clothing
        { name: 'Hiking boots', category: 'clothing', isEssential: true },
        { name: 'Trekking pants', category: 'clothing', quantity: 2 },
        { name: 'Base layers', category: 'clothing', quantity: 2 },
        { name: 'Fleece jacket', category: 'clothing', isEssential: true },
        { name: 'Rain jacket', category: 'clothing', isEssential: true },
        { name: 'Warm hat', category: 'clothing' },
        { name: 'Sun hat', category: 'clothing' },
        { name: 'Gloves', category: 'clothing' },
        { name: 'Hiking socks', category: 'clothing', quantity: 4 },
        
        // Gear
        { name: 'Backpack (40-60L)', category: 'gear', isEssential: true },
        { name: 'Sleeping bag', category: 'gear', isEssential: true },
        { name: 'Trekking poles', category: 'gear' },
        { name: 'Headlamp', category: 'gear', isEssential: true },
        { name: 'Water bottles', category: 'gear', quantity: 2, isEssential: true },
        { name: 'Sunglasses', category: 'gear', isEssential: true },
        
        // Documents
        { name: 'Passport', category: 'documents', isEssential: true },
        { name: 'Visa', category: 'documents', isEssential: true },
        { name: 'Travel insurance', category: 'documents', isEssential: true },
        { name: 'Permits', category: 'documents', isEssential: true },
        
        // Medical
        { name: 'First aid kit', category: 'medical', isEssential: true },
        { name: 'Altitude sickness medication', category: 'medical', isEssential: true },
        { name: 'Pain relievers', category: 'medical' },
        { name: 'Blister treatment', category: 'medical' },
        { name: 'Sunscreen (SPF 50+)', category: 'toiletries', isEssential: true },
        
        // Electronics
        { name: 'Phone & charger', category: 'electronics', isEssential: true },
        { name: 'Power bank', category: 'electronics', isEssential: true },
        { name: 'Camera', category: 'electronics' },
        
        // Other
        { name: 'Snacks & energy bars', category: 'food', quantity: 10 },
        { name: 'Water purification tablets', category: 'other', isEssential: true }
      ],
      
      city: [
        // Clothing
        { name: 'Comfortable walking shoes', category: 'clothing', isEssential: true },
        { name: 'Casual outfits', category: 'clothing', quantity: 3 },
        { name: 'Light jacket', category: 'clothing' },
        { name: 'Formal outfit', category: 'clothing' },
        
        // Documents
        { name: 'Passport', category: 'documents', isEssential: true },
        { name: 'Hotel reservations', category: 'documents' },
        { name: 'City maps', category: 'documents' },
        
        // Electronics
        { name: 'Phone & charger', category: 'electronics', isEssential: true },
        { name: 'Camera', category: 'electronics' },
        { name: 'Laptop/tablet', category: 'electronics' },
        
        // Toiletries
        { name: 'Toothbrush & toothpaste', category: 'toiletries', isEssential: true },
        { name: 'Shampoo & soap', category: 'toiletries' },
        { name: 'Deodorant', category: 'toiletries' },
        
        // Other
        { name: 'Day backpack', category: 'gear' },
        { name: 'Reusable water bottle', category: 'gear' }
      ],
      
      camping: [
        // Gear
        { name: 'Tent', category: 'gear', isEssential: true },
        { name: 'Sleeping bag', category: 'gear', isEssential: true },
        { name: 'Sleeping pad', category: 'gear', isEssential: true },
        { name: 'Camping stove', category: 'gear', isEssential: true },
        { name: 'Cooking pot', category: 'gear' },
        { name: 'Utensils', category: 'gear' },
        { name: 'Headlamp', category: 'gear', isEssential: true },
        { name: 'Matches/lighter', category: 'gear', isEssential: true },
        
        // Clothing
        { name: 'Warm layers', category: 'clothing', isEssential: true },
        { name: 'Rain gear', category: 'clothing', isEssential: true },
        { name: 'Extra socks', category: 'clothing', quantity: 3 },
        
        // Food
        { name: 'Meals (freeze-dried)', category: 'food', quantity: 3 },
        { name: 'Snacks', category: 'food', quantity: 5 },
        { name: 'Water filter', category: 'gear', isEssential: true },
        
        // Medical
        { name: 'First aid kit', category: 'medical', isEssential: true },
        { name: 'Insect repellent', category: 'toiletries' },
        
        // Other
        { name: 'Trash bags', category: 'other' },
        { name: 'Rope/cord', category: 'other' },
        { name: 'Multi-tool', category: 'gear' }
      ]
    };

    const templateItems = templates[template] || templates.trekking;
    
    const items = await PackingItem.insertMany(
      templateItems.map(item => ({
        ...item,
        tripId: id,
        createdBy: req.userId
      }))
    );

    res.status(201).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/trips/:id/packing/stats - Get packing statistics
exports.getPackingStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify access
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const items = await PackingItem.find({ tripId: id });
    
    const stats = {
      total: items.length,
      packed: items.filter(i => i.isPacked).length,
      unpacked: items.filter(i => !i.isPacked).length,
      essential: items.filter(i => i.isEssential).length,
      essentialPacked: items.filter(i => i.isEssential && i.isPacked).length,
      byCategory: {}
    };

    // Calculate by category
    items.forEach(item => {
      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = {
          total: 0,
          packed: 0,
          unpacked: 0
        };
      }
      stats.byCategory[item.category].total++;
      if (item.isPacked) {
        stats.byCategory[item.category].packed++;
      } else {
        stats.byCategory[item.category].unpacked++;
      }
    });

    stats.percentComplete = stats.total > 0 
      ? Math.round((stats.packed / stats.total) * 100) 
      : 0;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
