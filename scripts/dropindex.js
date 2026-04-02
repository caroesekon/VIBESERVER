const mongoose = require('mongoose');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Load environment variables
dotenv.config();

const dropIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.blue('Connected to MongoDB'));

    const db = mongoose.connection.db;
    const collection = db.collection('friendrequests');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log(chalk.yellow('Current indexes:'));
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop the old index
    try {
      await collection.dropIndex('sender_1_recipient_1');
      console.log(chalk.green('✅ Dropped index: sender_1_recipient_1'));
    } catch (err) {
      if (err.code === 27) {
        console.log(chalk.yellow('⚠️ Index not found, already dropped'));
      } else {
        throw err;
      }
    }

    // Also drop any other old indexes that might exist
    try {
      await collection.dropIndex('sender_1_receiver_1');
      console.log(chalk.green('✅ Dropped index: sender_1_receiver_1 (if existed)'));
    } catch (err) {
      // Ignore if not found
    }

    // Show remaining indexes
    const remainingIndexes = await collection.indexes();
    console.log(chalk.blue('Remaining indexes:'));
    remainingIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log(chalk.green('\n✅ Index cleanup completed!'));
    
  } catch (error) {
    console.error(chalk.red('Error dropping index:'), error);
  } finally {
    await mongoose.disconnect();
    console.log(chalk.yellow('Disconnected from MongoDB'));
    process.exit(0);
  }
};

// Run the script
dropIndex();