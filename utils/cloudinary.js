const cloudinary = require('cloudinary').v2;
const config = require('../config/env');

const uploadToCloudinary = async (filePath, options = {}) => {
  if (!config.useCloudinary) {
    throw new Error('Cloudinary not enabled');
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, options);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports = { uploadToCloudinary };