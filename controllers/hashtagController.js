const Hashtag = require('../models/Hashtag');
const Post = require('../models/Post');

// @desc    Get trending hashtags
// @route   GET /api/hashtags/trending
const getTrending = async (req, res) => {
  try {
    const tags = await Hashtag.find()
      .sort('-count')
      .limit(10);
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get posts by hashtag
// @route   GET /api/hashtags/:tag/posts
const getPostsByTag = async (req, res) => {
  try {
    const tag = req.params.tag;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const hashtag = await Hashtag.findOne({ tag });
    if (!hashtag) {
      return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    const posts = await Post.find({ _id: { $in: hashtag.posts } })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar')
      .lean();

    const total = hashtag.posts.length;

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get posts by tag error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getTrending, getPostsByTag };