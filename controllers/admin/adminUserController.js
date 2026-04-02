const User = require('../../models/User');
const BanList = require('../../models/admin/BanList');

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .lean();
    
    const total = await User.countDocuments(query);
    
    // Get ban information for each user
    const usersWithBanInfo = await Promise.all(users.map(async (user) => {
      const activeBan = await BanList.findOne({ user: user._id, active: true }).lean();
      return {
        ...user,
        isBanned: activeBan ? true : false,
        banInfo: activeBan ? {
          reason: activeBan.reason,
          bannedAt: activeBan.createdAt,
          expiresAt: activeBan.expiresAt,
          isPermanent: activeBan.isPermanent
        } : null
      };
    }));
    
    res.json({ 
      success: true, 
      data: usersWithBanInfo, 
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit) 
      } 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:userId
// @access  Private (Admin only)
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -refreshToken').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const activeBan = await BanList.findOne({ user: user._id, active: true }).lean();
    
    res.json({ 
      success: true, 
      data: {
        ...user,
        isBanned: activeBan ? true : false,
        banInfo: activeBan ? {
          reason: activeBan.reason,
          bannedAt: activeBan.createdAt,
          expiresAt: activeBan.expiresAt,
          isPermanent: activeBan.isPermanent
        } : null
      } 
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ban a user
// @route   PUT /api/admin/users/:userId/ban
// @access  Private (Admin only)
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, durationDays, permanent } = req.body;
    const expiresAt = !permanent && durationDays ? new Date(Date.now() + durationDays * 86400000) : null;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await BanList.create({
      user: userId,
      reason: reason || 'Violation of community guidelines',
      bannedBy: req.admin._id,
      expiresAt,
      isPermanent: !!permanent,
      active: true
    });
    
    await User.findByIdAndUpdate(userId, { isBanned: true });
    
    res.json({ success: true, message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unban a user
// @route   PUT /api/admin/users/:userId/unban
// @access  Private (Admin only)
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const ban = await BanList.findOneAndUpdate(
      { user: userId, active: true },
      { active: false, unbannedAt: new Date(), unbannedBy: req.admin._id }
    );
    
    if (!ban) {
      return res.status(404).json({ success: false, message: 'No active ban found' });
    }
    
    await User.findByIdAndUpdate(userId, { isBanned: false });
    
    res.json({ success: true, message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user permanently
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await BanList.deleteMany({ user: userId });
    
    res.json({ success: true, message: 'User deleted permanently' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserDetails,
  banUser,
  unbanUser,
  deleteUser,
};