const express = require('express');
const {
  createComment,
  updateComment,
  deleteComment,
  likeComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get comments for a post
router.get('/', protect, async (req, res) => {
  try {
    const { postId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ post: postId, parentComment: null })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name avatar')
      .lean();
    
    const total = await Comment.countDocuments({ post: postId, parentComment: null });
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);

module.exports = router;