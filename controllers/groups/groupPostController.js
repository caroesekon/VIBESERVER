const GroupPost = require('../../models/groups/GroupPost');
const GroupMember = require('../../models/groups/GroupMember');
const Notification = require('../../models/Notification');

// @desc    Create group post
// @route   POST /api/groups/posts/:groupId/posts
const createPost = async (req, res) => {
  try {
    const { content, images = [] } = req.body;
    const groupId = req.params.groupId;

    // Check membership
    const member = await GroupMember.findOne({ group: groupId, user: req.user._id });
    if (!member) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    const post = await GroupPost.create({
      group: groupId,
      user: req.user._id,
      content,
      images
    });

    await post.populate('user', 'name avatar');

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Create group post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get group posts
// @route   GET /api/groups/posts/:groupId/posts
const getPosts = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify membership for private groups? (optional)
    const posts = await GroupPost.find({ group: groupId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar')
      .lean();

    const total = await GroupPost.countDocuments({ group: groupId });

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get group posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update group post
// @route   PUT /api/groups/posts/:groupId/posts/:postId
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await GroupPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { content } = req.body;
    if (content !== undefined) post.content = content;
    await post.save();

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Update group post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete group post
// @route   DELETE /api/groups/posts/:groupId/posts/:postId
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await GroupPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Allow post owner or group admin to delete
    const isAdmin = await GroupMember.findOne({ group: req.params.groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (post.user.toString() !== req.user._id.toString() && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete group post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Like/unlike group post
// @route   POST /api/groups/posts/:groupId/posts/:postId/like
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await GroupPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id;
    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();

    res.json({ success: true, liked: !liked });
  } catch (error) {
    console.error('Like group post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Pin/unpin post
// @route   PUT /api/groups/posts/:groupId/posts/:postId/pin
const pinPost = async (req, res) => {
  try {
    const { postId, groupId } = req.params;
    const { pinned } = req.body;

    const isAdmin = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can pin posts' });
    }

    const post = await GroupPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.pinned = pinned;
    await post.save();

    res.json({ success: true, message: pinned ? 'Post pinned' : 'Post unpinned' });
  } catch (error) {
    console.error('Pin post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  likePost,
  pinPost
};