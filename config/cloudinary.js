const cloudinary = require('cloudinary').v2;
const chalk = require('chalk');
const config = require('./env');

const initCloudinary = () => {
  if (!config.useCloudinary) {
    console.log(chalk.yellow('⚠️ Cloudinary is disabled, skipping initialization'));
    return null;
  }

  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    console.error(chalk.red('❌ Cloudinary credentials missing'));
    return null;
  }

  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
  });

  console.log(chalk.green('✅ Cloudinary configured'));
  return cloudinary;
};

module.exports = { initCloudinary, cloudinary: () => cloudinary };