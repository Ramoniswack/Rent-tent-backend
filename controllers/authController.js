const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate unique username from name
const generateUsername = async (name) => {
  // Convert name to lowercase and remove special characters
  let baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15); // Limit to 15 characters
  
  if (!baseUsername) {
    baseUsername = 'user';
  }
  
  // Check if username exists
  let username = baseUsername;
  let counter = 1;
  
  while (await User.findOne({ username })) {
    // Add random number if username exists
    const randomNum = Math.floor(Math.random() * 9999);
    username = `${baseUsername}${randomNum}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 10) {
      username = `${baseUsername}${Date.now()}`;
      break;
    }
  }
  
  return username;
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate unique username from name
    const username = await generateUsername(name);

    // Create new user
    const user = new User({ email, password, name, username });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, email: user.email, name: user.name, username: user.username }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Find user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate Cloudinary signature for public uploads (registration, etc.)
exports.getPublicCloudinarySignature = async (req, res) => {
  try {
    const crypto = require('crypto');
    
    // Generate timestamp
    const timestamp = Math.round(Date.now() / 1000);
    
    // Define upload parameters for signing
    // Note: Only certain parameters should be included in the signature
    // resource_type and max_file_size are NOT signed, they're just upload constraints
    const paramsToSign = {
      timestamp: timestamp,
      folder: 'profiles',
      tags: 'profile_image'
    };
    
    // Create string to sign (alphabetically sorted parameters)
    const stringToSign = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key]}`)
      .join('&') + process.env.CLOUDINARY_API_SECRET;
    
    // Generate signature using SHA-1 (Cloudinary's default)
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex');
    
    // Return signature and upload parameters
    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      uploadParams: {
        folder: paramsToSign.folder,
        tags: paramsToSign.tags
      }
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
};
