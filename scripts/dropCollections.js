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
    const collectionsArg = process.argv[2];
    if (!collectionsArg) {
      console.log(chalk.yellow('Usage: npm run drop-collections -- collection1,collection2'));
      process.exit(1);
    }
    const collectionsToDrop = collectionsArg.split(',');
    const answer = await question(chalk.red(`⚠️  Drop collections: ${collectionsToDrop.join(', ')}? Type "yes": `));
    if (answer !== 'yes') {
      console.log(chalk.yellow('Aborted.'));
      process.exit(0);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    for (const name of collectionsToDrop) {
      try {
        await db.collection(name).drop();
        console.log(chalk.green(`✅ Dropped collection: ${name}`));
      } catch (err) {
        if (err.code === 26) console.log(chalk.yellow(`Collection ${name} not found.`));
        else throw err;
      }
    }
  } catch (err) {
    console.error(chalk.red('Error dropping collections:'), err);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
})();