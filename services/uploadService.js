const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const config = require('../config/env');

const uploadLocal = (file, folder = '') => {
  const uploadPath = path.join(config.uploadPath, folder);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  const filename = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadPath, filename);
  fs.renameSync(file.path, filePath);
  const relativePath = path.join(folder, filename).replace(/\\/g, '/');
  return `${config.apiBaseUrl}/uploads/${relativePath}`;
};

const uploadCloudinary = async (file, folder = 'vibe') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, { folder });
    fs.unlinkSync(file.path); // remove temp file
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const uploadImage = async (file, folder = '') => {
  if (config.useCloudinary) {
    return uploadCloudinary(file, folder);
  } else {
    return uploadLocal(file, folder);
  }
};

module.exports = { uploadImage, uploadLocal, uploadCloudinary };