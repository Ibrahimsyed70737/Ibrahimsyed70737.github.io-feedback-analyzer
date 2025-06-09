// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

// Middleware to protect routes (ensure user is authenticated)
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]; // Format: "Bearer TOKEN"

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user (without password) to the request object
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is provided
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to authorize specific roles (e.g., only principal)
const authorize = (roles) => {
  return (req, res, next) => {
    // Check if req.user (attached by 'protect' middleware) exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden, user role not defined' });
    }
    // Check if the user's role is included in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden, user role '${req.user.role}' is not authorized to access this resource` });
    }
    next(); // Proceed if authorized
  };
};

module.exports = { protect, authorize };
