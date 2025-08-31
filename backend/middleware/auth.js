const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE DEBUG ===');
  console.log('Method:', req.method, 'URL:', req.originalUrl);
  console.log('Headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');
  
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    console.log('AUTH ERROR: No token provided');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded for user:', decoded.id);

    req.user = await User.findById(decoded.id);
    console.log('User found:', req.user ? req.user.name : 'User not found');

    next();
  } catch (err) {
    console.log('AUTH ERROR: Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};