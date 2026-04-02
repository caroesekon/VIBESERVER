const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chalk = require('chalk');

// Example migration: add `phone` field to User if missing
const migrateUsers = async () => {
  const User = require('../models/User');
  const result = await User.updateMany(
    { phone: { $exists: false } },
    { $set: { phone: '' } }
  );
  console.log(chalk.green(`✅ Added phone field to ${result.modifiedCount} users`));
};

// Add more migration functions here

const migrations = [migrateUsers];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.blue('Connected, running migrations...'));

    for (const migration of migrations) {
      await migration();
    }

    console.log(chalk.green('All migrations completed.'));
  } catch (err) {
    console.error(chalk.red('Migration failed:'), err);
  } finally {
    await mongoose.disconnect();
  }
})();