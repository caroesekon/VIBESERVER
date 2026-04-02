const cron = require('node-cron');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Example: Send weekly digest emails
const sendWeeklyDigest = async () => {
  try {
    const users = await User.find({ emailNotifications: true }); // need field in user
    for (const user of users) {
      // gather activity for the week
      const subject = 'Your Weekly Vibe Digest';
      const html = `<p>Hello ${user.name}, here's what you missed...</p>`;
      await sendEmail(user.email, subject, html);
    }
    console.log(`Sent weekly digest to ${users.length} users`);
  } catch (error) {
    console.error('Error sending weekly digest:', error);
  }
};

// Schedule email jobs
const scheduleEmailJobs = () => {
  // Every Monday at 8am
  cron.schedule('0 8 * * 1', sendWeeklyDigest);
  console.log('Email jobs scheduled');
};

module.exports = scheduleEmailJobs;