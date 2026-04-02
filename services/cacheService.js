const { getRedis } = require('../config/redis');

class CacheService {
  constructor() {
    this.redis = getRedis();
  }

  async get(key) {
    if (!this.redis) return null;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, ttl = 60) {
    if (!this.redis) return false;
    await this.redis.setex(key, ttl, JSON.stringify(value));
    return true;
  }

  async del(key) {
    if (!this.redis) return false;
    await this.redis.del(key);
    return true;
  }

  async clearPattern(pattern) {
    if (!this.redis) return false;
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(keys);
    }
    return true;
  }

  // Generate cache key for feed
  feedKey(userId, page = 1, limit = 10) {
    return `feed:${userId}:${page}:${limit}`;
  }

  // Invalidate user's feed cache
  async invalidateUserFeed(userId) {
    return this.clearPattern(`feed:${userId}:*`);
  }
}

module.exports = new CacheService();