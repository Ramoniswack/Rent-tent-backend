const User = require('../models/User');
const GearRental = require('../models/GearRental');

// GET /api/wishlist - Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'wishlist',
        populate: {
          path: 'owner',
          select: 'name username profilePicture'
        }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter out any null items (in case gear was deleted)
    const wishlist = user.wishlist.filter(item => item !== null);

    res.json(wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

// POST /api/wishlist/:gearId - Add gear to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { gearId } = req.params;

    // Check if gear exists
    const gear = await GearRental.findById(gearId);
    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    // Add to wishlist if not already there
    const user = await User.findById(req.userId);
    if (!user.wishlist.includes(gearId)) {
      user.wishlist.push(gearId);
      await user.save();
    }

    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
};

// DELETE /api/wishlist/:gearId - Remove gear from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { gearId } = req.params;

    const user = await User.findById(req.userId);
    user.wishlist = user.wishlist.filter(id => id.toString() !== gearId);
    await user.save();

    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
};

// GET /api/wishlist/check/:gearId - Check if gear is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const { gearId } = req.params;

    const user = await User.findById(req.userId);
    const inWishlist = user.wishlist.some(id => id.toString() === gearId);

    res.json({ inWishlist });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
};
