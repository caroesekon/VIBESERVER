const cron = require('node-cron');
const Story = require('../models/Story');
const BlacklistedToken = require('../models/BlacklistedToken');

// Run every hour: delete expired stories
const deleteExpiredStories = async () => {
  try {
    const result = await Story.deleteMany({ expiresAt: { $lt: new Date() } });
    if (result.deletedCount > 0) {
      console.log(`Deleted ${result.deletedCount} expired stories`);
    }
  } catch (error) {
    console.error('Error deleting expired stories:', error);
  }
};

// Run daily: clean expired blacklisted tokens (though TTL index may handle it)
const cleanExpiredTokens = async () => {
  try {
    const result = await BlacklistedToken.deleteMany({ expiresAt: { $lt: new Date() } });
    if (result.deletedCount > 0) {
      console.log(`Deleted ${result.deletedCount} expired tokens`);
    }
  } catch (error) {
    console.error('Error cleaning tokens:', error);
  }
};

// Schedule jobs
const scheduleCleanupJobs = () => {
  // Delete expired stories every hour
  cron.schedule('0 * * * *', deleteExpiredStories);
  // Clean tokens daily at 3am
  cron.schedule('0 3 * * *', cleanExpiredTokens);
  console.log('Cleanup jobs scheduled');
};

module.exports = scheduleCleanupJobs;