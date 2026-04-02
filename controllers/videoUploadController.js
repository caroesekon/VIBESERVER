const Video = require('../models/Video');
const fs = require('fs');

// @desc    Upload video
// @route   POST /api/upload/video
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }

    const { title, description, category, tags } = req.body;
    let thumbnail = req.body.thumbnail;

    // Get video URL
    let videoUrl;
    if (process.env.USE_CLOUDINARY === 'true') {
      const cloudinary = require('cloudinary').v2;
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'video',
        folder: 'vibe/videos'
      });
      videoUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else {
      const relativePath = `/uploads/videos/${req.file.filename}`;
      videoUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    }

    const video = await Video.create({
      uploader: req.user._id,
      title: title || 'Untitled Video',
      description: description || '',
      videoUrl,
      thumbnail: thumbnail || '',
      category: category || 'other',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      duration: 0
    });

    await video.populate('uploader', 'name avatar');

    res.status(201).json({ success: true, data: video });
  } catch (error) {
    console.error('Upload video error:', error);
    // Clean up uploaded file if error occurs
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to delete file:', e);
      }
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { uploadVideo };