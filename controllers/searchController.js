const User = require('../models/User');
const Post = require('../models/Post');
const Group = require('../models/groups/Group');

// @desc    Global search
// @route   GET /api/search
const globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const results = {};

    // Search Users
    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { bio: { $regex: searchQuery, $options: 'i' } }
        ],
        _id: { $ne: req.user?._id } // exclude current user if logged in
      })
        .select('name email avatar bio')
        .limit(parseInt(limit))
        .lean();

      results.users = users;
    }

    // Search Posts
    if (type === 'all' || type === 'posts') {
      const posts = await Post.find({
        $or: [
          { content: { $regex: searchQuery, $options: 'i' } }
        ],
        privacy: { $in: ['public'] } // only public posts for search
      })
        .populate('user', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      results.posts = posts;
    }

    // Search Groups
    if (type === 'all' || type === 'groups') {
      const groups = await Group.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { topics: { $regex: searchQuery, $options: 'i' } }
        ],
        privacy: { $ne: 'secret' } // exclude secret groups from public search
      })
        .select('name description coverPhoto privacy members')
        .limit(parseInt(limit))
        .lean();

      results.groups = groups;
    }

    res.json({ 
      success: true, 
      data: results,
      query: searchQuery,
      type
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Search users specifically
// @route   GET /api/search/users
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find({
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
        { bio: { $regex: q.trim(), $options: 'i' } }
      ],
      _id: { $ne: req.user?._id }
    })
      .select('name email avatar bio')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments({
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
        { bio: { $regex: q.trim(), $options: 'i' } }
      ],
      _id: { $ne: req.user?._id }
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Search posts specifically
// @route   GET /api/search/posts
const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find({
      content: { $regex: q.trim(), $options: 'i' },
      privacy: { $in: ['public'] }
    })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Post.countDocuments({
      content: { $regex: q.trim(), $options: 'i' },
      privacy: { $in: ['public'] }
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Search groups specifically
// @route   GET /api/search/groups
const searchGroups = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const groups = await Group.find({
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { topics: { $regex: q.trim(), $options: 'i' } }
      ],
      privacy: { $ne: 'secret' }
    })
      .select('name description coverPhoto privacy members')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Group.countDocuments({
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { topics: { $regex: q.trim(), $options: 'i' } }
      ],
      privacy: { $ne: 'secret' }
    });

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search groups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  globalSearch,
  searchUsers,
  searchPosts,
  searchGroups
};