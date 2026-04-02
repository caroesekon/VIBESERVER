const { getRedis } = require('../config/redis');

// Middleware to cache GET responses
const cache = (duration = 60) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const redis = getRedis();
    if (!redis) {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        return res.json(data);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(key, duration, JSON.stringify(body)).catch(console.error);
        }
        originalJson.call(this, body);
      };
      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      next();
    }
  };
};

module.exports = { cache };