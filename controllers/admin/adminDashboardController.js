const User = require('../../models/User');
const Post = require('../../models/Post');
const Group = require('../../models/groups/Group');
const Report = require('../../models/admin/Report');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const totalUsers = await User.countDocuments();
    const totalGroups = await Group.countDocuments();
    const totalPosts = await Post.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const newUsersToday = await User.countDocuments({ 
      createdAt: { $gte: today } 
    });
    const activeUsers = await User.countDocuments({ 
      lastSeen: { $gte: sevenDaysAgo } 
    });
    
    res.json({ 
      success: true,
      totalUsers,
      totalGroups,
      totalPosts,
      pendingReports,
      newUsersToday,
      activeUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent activity
// @route   GET /api/admin/dashboard/recent-activity
// @access  Private (Admin only)
const getRecentActivity = async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name');
    
    const activities = [
      ...recentUsers.map(u => ({ 
        message: `New user registered: ${u.name}`, 
        timestamp: u.createdAt,
        icon: '👤'
      })),
      ...recentPosts.map(p => ({ 
        message: `New post by ${p.user?.name || 'Unknown'}`, 
        timestamp: p.createdAt,
        icon: '📝'
      }))
    ];
    
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStats,
  getRecentActivity,
};