const Redis = require('ioredis');
const chalk = require('chalk');
const config = require('./env');

let redisClient = null;

const initRedis = async () => {
  if (!config.useRedis) {
    console.log(chalk.yellow('⚠️ Redis is disabled, skipping initialization'));
    return null;
  }

  try {
    redisClient = new Redis(config.redisUrl, {
      password: config.redisPassword,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redisClient.on('connect', () => {
      console.log(chalk.green('✅ Redis connected'));
    });

    redisClient.on('error', (err) => {
      console.error(chalk.red('Redis error:'), err);
    });

    // Test connection
    await redisClient.ping();
    return redisClient;
  } catch (error) {
    console.error(chalk.red('Failed to connect to Redis:'), error.message);
    return null;
  }
};

const getRedis = () => redisClient;

module.exports = { initRedis, getRedis };