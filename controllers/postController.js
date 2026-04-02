const Post = require('../models/Post');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const GroupMember = require('../models/groups/GroupMember');

// Helper: get friend list IDs
const getFriendIds = async (userId) => {
  const user = await User.findById(userId).populate('friends', '_id');
  return user.friends.map(f => f._id);
};

// Helper function to get emoji for reaction type
const getReactionEmoji = (type) => {
  const emojis = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠'
  };
  return emojis[type] || '👍';
};

// @desc    Create post
// @route   POST /api/posts
const createPost = async (req, res) => {
  try {
    const { content, privacy = 'public', images = [] } = req.body;

    const post = await Post.create({
      user: req.user._id,
      content,
      privacy,
      images,
      reactions: [],
      comments: []
    });

    await post.populate('user', 'name avatar');

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get feed (posts from user + friends + groups)
// @route   GET /api/posts/feed
const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = req.user._id;

    const user = await User.findById(userId).populate('friends', '_id');
    const friendIds = user.friends.map(f => f._id);
    friendIds.push(userId);

    const groupMemberships = await GroupMember.find({ user: userId }).select('group');
    const groupIds = groupMemberships.map(g => g.group);

    const query = {
      $or: [
        { user: userId },
        { user: { $in: friendIds } },
        { group: { $in: groupIds } }
      ],
      privacy: { $in: ['public', 'friends'] }
    };

    const posts = await Post.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .lean();

    const postsWithReactions = posts.map(post => {
      // Find the current user's reaction
      let userReaction = null;
      const reactionCounts = {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0
      };
      
      if (post.reactions && Array.isArray(post.reactions)) {
        post.reactions.forEach(r => {
          if (r.user && r.user.toString() === userId.toString()) {
            userReaction = r.type;
          }
          if (reactionCounts.hasOwnProperty(r.type)) {
            reactionCounts[r.type]++;
          }
        });
      }

      return {
        ...post,
        userReaction,
        reactionCounts
      };
    });

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: postsWithReactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get posts by user ID
// @route   GET /api/posts/user/:userId
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.params.userId;

    const query = {
      user: userId,
      privacy: { $in: ['public', 'friends'] }
    };

    const posts = await Post.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .lean();

    const postsWithReactions = posts.map(post => {
      let userReaction = null;
      const reactionCounts = {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0
      };
      
      if (post.reactions && Array.isArray(post.reactions)) {
        post.reactions.forEach(r => {
          if (req.user && r.user && r.user.toString() === req.user._id.toString()) {
            userReaction = r.type;
          }
          if (reactionCounts.hasOwnProperty(r.type)) {
            reactionCounts[r.type]++;
          }
        });
      }

      return {
        ...post,
        userReaction,
        reactionCounts
      };
    });

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: postsWithReactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.privacy === 'only-me' && post.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (post.privacy === 'friends') {
      const friendIds = await getFriendIds(req.user._id);
      if (!friendIds.includes(post.user._id) && post.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    let userReaction = null;
    const reactionCounts = {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0
    };
    
    if (post.reactions && Array.isArray(post.reactions)) {
      post.reactions.forEach(r => {
        if (r.user && r.user.toString() === req.user._id.toString()) {
          userReaction = r.type;
        }
        if (reactionCounts.hasOwnProperty(r.type)) {
          reactionCounts[r.type]++;
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...post,
        userReaction,
        reactionCounts
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { content } = req.body;
    if (content !== undefined) post.content = content;

    await post.save();
    await post.populate('user', 'name avatar');

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await post.deleteOne();
    await Like.deleteMany({ post: post._id });
    await Comment.deleteMany({ post: post._id });

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Like/unlike post with reaction
// @route   POST /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { reaction = 'like' } = req.body;

    console.log('Reaction request:', { postId, userId, reaction });

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Initialize reactions array if it doesn't exist
    if (!post.reactions) {
      post.reactions = [];
    }

    // Check if user already reacted
    const existingReactionIndex = post.reactions.findIndex(r => r.user && r.user.toString() === userId.toString());

    let userReaction = null;
    let message = '';
    let notificationType = '';

    if (existingReactionIndex !== -1) {
      const existingReaction = post.reactions[existingReactionIndex];
      if (existingReaction.type === reaction) {
        // Remove reaction
        post.reactions.splice(existingReactionIndex, 1);
        message = `${req.user.name} removed their reaction from your post`;
        notificationType = 'reaction_removed';
        userReaction = null;
      } else {
        // Update reaction type
        post.reactions[existingReactionIndex].type = reaction;
        post.reactions[existingReactionIndex].createdAt = new Date();
        userReaction = reaction;
        message = `${req.user.name} reacted with ${getReactionEmoji(reaction)} to your post`;
        notificationType = reaction;
      }
    } else {
      // Add new reaction
      post.reactions.push({ 
        user: userId, 
        type: reaction,
        createdAt: new Date()
      });
      userReaction = reaction;
      message = `${req.user.name} reacted with ${getReactionEmoji(reaction)} to your post`;
      notificationType = reaction;
    }

    await post.save();

    // Calculate reaction counts
    const reactionCounts = {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0
    };
    post.reactions.forEach(r => {
      if (reactionCounts.hasOwnProperty(r.type)) {
        reactionCounts[r.type]++;
      }
    });

    // Create notification for post owner (if not own post)
    if (post.user.toString() !== userId.toString()) {
      await Notification.create({
        user: post.user,
        type: notificationType,
        sender: userId,
        post: postId,
        message: message
      });

      // Emit socket event for real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${post.user}`).emit('new_notification', {
          type: notificationType,
          sender: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar
          },
          postId,
          message: message
        });
      }
    }

    res.json({
      success: true,
      data: {
        userReaction,
        reactionCounts,
        totalReactions: post.reactions.length
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share post
// @route   POST /api/posts/:id/share
const sharePost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { content } = req.body;
    const sharedPost = await Post.create({
      user: req.user._id,
      content: content || '',
      originalPost: originalPost._id,
      privacy: originalPost.privacy,
      images: [],
      reactions: [],
      comments: []
    });

    await sharedPost.populate('user', 'name avatar');
    res.status(201).json({ success: true, data: sharedPost });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getFeed,
  getUserPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  sharePost
};