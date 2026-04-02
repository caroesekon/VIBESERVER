const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

/**
 * Protect middleware - requires valid JWT token
 * Attaches user to req.user if authenticated
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Also check cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated, please login again'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid or expired'
      });
    }

    // Get user from token (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

/**
 * Optional auth - doesn't block if no token
 * Attaches user if token is valid, otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const blacklisted = await BlacklistedToken.findOne({ token });
      if (!blacklisted) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          const user = await User.findById(decoded.id).select('-password');
          if (user && !user.isBanned) {
            req.user = user;
          }
        }
      }
    } catch (error) {
      // Silent fail - just proceed without user
    }
  }
  next();
};

/**
 * Restrict access based on user roles
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'moderator')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

/**
 * Check if user owns a resource
 * @param {Function} getResourceId - Function to extract resource ID from request
 */
const checkOwnership = (getResourceId) => {
  return async (req, res, next) => {
    try {
      const resourceId = getResourceId(req);
      if (!resourceId) {
        return next();
      }

      // This is a generic check - specific models will need to be checked
      // For now, we'll just pass through and let controllers handle ownership
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  checkOwnership
};