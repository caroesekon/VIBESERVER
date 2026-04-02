const rateLimit = require('express-rate-limit');

// General limiter for all API routes
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Trust proxy headers (for Nginx/Cloudflare)
  skip: (req) => process.env.NODE_ENV === 'development', // Skip in development
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
  trustProxy: true, // Trust proxy headers
  skip: (req) => process.env.NODE_ENV === 'development', // Skip in development
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
});

// Conditional rate limiting based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

const conditionalLimiter = isDevelopment 
  ? (req, res, next) => next() 
  : limiter;

const conditionalAuthLimiter = isDevelopment
  ? (req, res, next) => next()
  : authLimiter;

module.exports = { 
  limiter: conditionalLimiter, 
  authLimiter: conditionalAuthLimiter 
};