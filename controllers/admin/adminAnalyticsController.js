const User = require('../../models/User');
const Post = require('../../models/Post');
const Group = require('../../models/groups/Group');

// @desc    Get overview analytics
// @route   GET /api/admin/analytics/overview
// @access  Private (Admin only)
const getOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastSeen: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });
    const totalPosts = await Post.countDocuments();
    const totalGroups = await Group.countDocuments();
    
    res.json({ 
      success: true, 
      data: { 
        totalUsers, 
        activeUsers, 
        totalPosts, 
        totalGroups
      } 
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user analytics (growth)
// @route   GET /api/admin/analytics/users-growth
// @access  Private (Admin only)
const getUserGrowth = async (req, res) => {
  try {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      last30Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    res.json({ success: true, data: last30Days });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private (Admin only)
const getUserAnalytics = async (req, res) => {
  try {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      last30Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    res.json({ success: true, data: last30Days });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group analytics
// @route   GET /api/admin/analytics/groups
// @access  Private (Admin only)
const getGroupAnalytics = async (req, res) => {
  try {
    const groupsByPrivacy = await Group.aggregate([
      { $group: { _id: '$privacy', count: { $sum: 1 } } }
    ]);
    
    const createdPerDay = await Group.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        byPrivacy: groupsByPrivacy,
        createdPerDay: createdPerDay.reverse()
      } 
    });
  } catch (error) {
    console.error('Get group analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverview,
  getUserAnalytics,
  getGroupAnalytics,
  getUserGrowth,
};