const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chalk = require('chalk');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

(async () => {
  try {
    const answer = await question(chalk.red('⚠️  This will DROP the entire database. Type "yes" to confirm: '));
    if (answer !== 'yes') {
      console.log(chalk.yellow('Aborted.'));
      process.exit(0);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.db.dropDatabase();
    console.log(chalk.green('✅ Database dropped successfully.'));
  } catch (err) {
    console.error(chalk.red('Error dropping database:'), err);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
})();