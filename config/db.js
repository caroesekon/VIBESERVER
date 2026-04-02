const mongoose = require('mongoose');
const chalk = require('chalk');

let connectionStatus = 'disconnected';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    connectionStatus = 'connected';
    console.log(chalk.green(`✅ MongoDB Connected: ${conn.connection.host}`));
    return conn;
  } catch (error) {
    connectionStatus = 'error';
    console.error(chalk.red(`❌ MongoDB Connection Error: ${error.message}`));
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    connectionStatus = 'disconnected';
    console.log(chalk.yellow('MongoDB disconnected'));
  } catch (error) {
    console.error(chalk.red(`Error disconnecting MongoDB: ${error.message}`));
  }
};

const getConnectionStatus = () => connectionStatus;

module.exports = { connectDB, disconnectDB, getConnectionStatus };