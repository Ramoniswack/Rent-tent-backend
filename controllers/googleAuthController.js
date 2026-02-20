const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify Firebase ID token and login/register user
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Firebase token is required' });
    }

    // Verify the Firebase ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name, picture, uid: googleId } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        googleId,
        profilePicture: picture,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Random password (won't be used)
        username: email.split('@')[0] + Math.random().toString(36).slice(-4),
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data and token
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};
