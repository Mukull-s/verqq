const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No token provided in request');
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      console.log('Attempting JWT verification');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user) {
        console.error('User not found for JWT token:', decoded.id);
        return res.status(401).json({
          status: 'error',
          message: 'User no longer exists'
        });
      }
      
      console.log('JWT authentication successful for user:', user._id);
      req.user = user;
      return next();
    } catch (jwtError) {
      console.error('JWT token verification failed:', jwtError.message);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = authMiddleware; 