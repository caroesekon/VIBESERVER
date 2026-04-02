const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// @desc    Upload single image
// @route   POST /api/upload/image
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let imageUrl;
    if (process.env.USE_CLOUDINARY === 'true') {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'vibe/posts' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else {
      const relativePath = `/uploads/${req.file.filename}`;
      imageUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    }

    // Return just the URL, not an object
    res.json({ success: true, data: { url: imageUrl } });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const urls = [];
    for (const file of req.files) {
      let imageUrl;
      if (process.env.USE_CLOUDINARY === 'true') {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'vibe/posts' });
        imageUrl = result.secure_url;
        fs.unlinkSync(file.path);
      } else {
        const relativePath = `/uploads/${file.filename}`;
        imageUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
      }
      urls.push(imageUrl);
    }

    res.json({ success: true, data: { urls } });
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { uploadImage, uploadImages };