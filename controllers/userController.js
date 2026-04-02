const User = require('../models/User');
const Post = require('../models/Post');
const FriendRequest = require('../models/FriendRequest');

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get friends list for this user
    const friends = await User.find({ _id: { $in: user.friends || [] } })
      .select('name avatar')
      .lean();

    // Check if requester is friend (if logged in)
    let isFriend = false;
    let friendRequestStatus = null;
    if (req.user) {
      isFriend = (user.friends || []).some(friendId => friendId.toString() === req.user._id.toString());
      const request = await FriendRequest.findOne({
        $or: [
          { sender: req.user._id, receiver: user._id, status: 'pending' },
          { sender: user._id, receiver: req.user._id, status: 'pending' }
        ]
      });
      if (request) friendRequestStatus = request.status;
    }

    // Get post count
    const postCount = await Post.countDocuments({ user: user._id });

    res.json({
      success: true,
      data: {
        ...user,
        friendsList: friends,
        postCount,
        isFriend,
        friendRequestStatus
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, location, website, gender } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (gender !== undefined) user.gender = gender;

    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update avatar
// @route   PUT /api/users/avatar
const updateAvatar = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;
    
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      imageUrl = imageUrl.imageUrl || imageUrl.url;
    }
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const user = await User.findById(req.user._id);
    user.avatar = imageUrl;
    await user.save();

    res.json({ success: true, data: { avatar: user.avatar } });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update cover photo
// @route   PUT /api/users/cover
const updateCover = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;
    
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      imageUrl = imageUrl.imageUrl || imageUrl.url;
    }
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const user = await User.findById(req.user._id);
    user.coverPhoto = imageUrl;
    await user.save();

    res.json({ success: true, data: { coverPhoto: user.coverPhoto } });
  } catch (error) {
    console.error('Update cover error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    })
      .select('name email avatar bio')
      .limit(20)
      .lean();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get friend suggestions
// @route   GET /api/users/suggestions
const getSuggestions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friendIds = user?.friends || [];
    const excludeIds = [...friendIds, req.user._id];
    
    // Get users who are not friends and not self
    const suggestions = await User.find({ 
      _id: { $nin: excludeIds },
      isBanned: false
    })
      .select('name email avatar bio')
      .limit(10)
      .lean();

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user photos (posts with images)
// @route   GET /api/users/:userId/photos
const getUserPhotos = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const posts = await Post.find({ 
      user: userId,
      images: { $exists: true, $not: { $size: 0 } }
    })
      .select('images createdAt')
      .sort('-createdAt')
      .limit(20)
      .lean();
    
    const photos = posts.flatMap(post => post.images);
    
    res.json({ success: true, data: photos });
  } catch (error) {
    console.error('Get user photos error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user videos (posts with videos)
// @route   GET /api/users/:userId/videos
const getUserVideos = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const videos = await Video.find({ uploader: userId })
      .select('title thumbnail views createdAt')
      .sort('-createdAt')
      .limit(20)
      .lean();
    
    res.json({ success: true, data: videos });
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  searchUsers,
  getSuggestions,
  getUserPhotos,
  getUserVideos
};