const jwt = require('jsonwebtoken');

// JWT authentication middleware for protected routes
const authMiddleware = (req, res, next) => {
  try {
    // Extract token from Authorization header (Bearer token)
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token and extract user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
