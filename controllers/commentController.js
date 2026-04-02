const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Like = require('../models/Like');
const Notification = require('../models/Notification');

// @desc    Create comment
// @route   POST /api/comments
const createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      user: req.user._id,
      post: postId,
      content,
      parentComment: parentCommentId || null
    });

    await comment.populate('user', 'name avatar');

    // Add comment to post's comments array
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    // Create notification (if not own post)
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.user,
        type: 'comment',
        sender: req.user._id,
        post: postId,
        message: `${req.user.name} commented on your post`
      });
    }

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.content = req.body.content;
    await comment.save();

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
    // Also delete replies
    await Comment.deleteMany({ parentComment: comment._id });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Like/unlike comment
// @route   POST /api/comments/:id/like
const likeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    const existingLike = await Like.findOne({ user: userId, comment: commentId });
    if (existingLike) {
      await existingLike.deleteOne();
      res.json({ success: true, liked: false });
    } else {
      await Like.create({ user: userId, comment: commentId });
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createComment,
  updateComment,
  deleteComment,
  likeComment
};