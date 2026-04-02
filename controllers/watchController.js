const Video = require('../models/Video');

// @desc    Get all videos
// @route   GET /api/watch/videos
const getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category } = req.query;

    let query = { status: 'published' };
    if (category && category !== 'all') {
      query.category = category;
    }

    const videos = await Video.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'name avatar')
      .lean();

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single video
// @route   GET /api/watch/videos/:id
const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'name avatar')
      .populate('comments.user', 'name avatar')
      .lean();

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Increment views
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ success: true, data: video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Like/unlike video
// @route   POST /api/watch/videos/:id/like
const likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const userId = req.user._id;
    const liked = video.likes.includes(userId);
    
    if (liked) {
      video.likes.pull(userId);
    } else {
      video.likes.push(userId);
    }
    
    await video.save();
    
    res.json({ success: true, liked: !liked, likesCount: video.likes.length });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Comment on video
// @route   POST /api/watch/videos/:id/comment
const commentOnVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content required' });
    }

    video.comments.push({
      user: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    });

    await video.save();
    
    const newComment = video.comments[video.comments.length - 1];
    await Video.populate(newComment, { path: 'user', select: 'name avatar' });

    res.status(201).json({ success: true, data: newComment });
  } catch (error) {
    console.error('Comment on video error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete video
// @route   DELETE /api/watch/videos/:id
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await video.deleteOne();
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getVideos,
  getVideo,
  likeVideo,
  commentOnVideo,
  deleteVideo
};