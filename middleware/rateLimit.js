const rateLimit = require('express-rate-limit');

// General limiter for all API routes - MORE GENEROUS
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 200, // Allow 200 requests per minute (up from 100)
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
});

// Stricter limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
});

// Development mode - disable rate limiting
const isDevelopment = process.env.NODE_ENV === 'development';

// Conditional rate limiting
const conditionalLimiter = isDevelopment 
  ? (req, res, next) => next() // Skip in development
  : limiter;

const conditionalAuthLimiter = isDevelopment
  ? (req, res, next) => next() // Skip in development
  : authLimiter;

module.exports = { 
  limiter: conditionalLimiter, 
  authLimiter: conditionalAuthLimiter 
};