const Group = require('../../models/groups/Group');
const GroupMember = require('../../models/groups/GroupMember');
const GroupPost = require('../../models/groups/GroupPost');

// @desc    Get all groups with pagination and search
// @route   GET /api/admin/groups
// @access  Private (Admin only)
const getGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status !== 'all') {
      query.isActive = status === 'active';
    }
    
    const groups = await Group.find(query)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    
    const total = await Group.countDocuments(query);
    
    res.json({
      success: true,
      data: groups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single group details
// @route   GET /api/admin/groups/:groupId
// @access  Private (Admin only)
const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('owner', 'name email avatar')
      .populate('createdBy', 'name email');
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    const members = await GroupMember.find({ group: group._id, status: 'approved' }).countDocuments();
    const posts = await GroupPost.find({ group: group._id }).countDocuments();
    
    res.json({
      success: true,
      data: {
        ...group.toObject(),
        membersCount: members,
        postsCount: posts
      }
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve group
// @route   PUT /api/admin/groups/:groupId/approve
// @access  Private (Admin only)
const approveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    group.isActive = true;
    await group.save();
    
    res.json({ success: true, message: 'Group approved', data: group });
  } catch (error) {
    console.error('Approve group error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject group
// @route   PUT /api/admin/groups/:groupId/reject
// @access  Private (Admin only)
const rejectGroup = async (req, res) => {
  try {
    const { reason } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    group.isActive = false;
    group.rejectionReason = reason;
    await group.save();
    
    res.json({ success: true, message: 'Group rejected', data: group });
  } catch (error) {
    console.error('Reject group error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete group
// @route   DELETE /api/admin/groups/:groupId
// @access  Private (Admin only)
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    await GroupMember.deleteMany({ group: group._id });
    await GroupPost.deleteMany({ group: group._id });
    await group.deleteOne();
    
    res.json({ success: true, message: 'Group deleted permanently' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group members
// @route   GET /api/admin/groups/:groupId/members
// @access  Private (Admin only)
const getGroupMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const members = await GroupMember.find({ group: req.params.groupId, status: 'approved' })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar');
    
    const total = await GroupMember.countDocuments({ group: req.params.groupId, status: 'approved' });
    
    res.json({
      success: true,
      data: members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove group member
// @route   DELETE /api/admin/groups/:groupId/members/:userId
// @access  Private (Admin only)
const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    await GroupMember.deleteOne({ group: groupId, user: userId });
    await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: -1 } });
    
    res.json({ success: true, message: 'Member removed from group' });
  } catch (error) {
    console.error('Remove group member error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change group owner
// @route   PUT /api/admin/groups/:groupId/owner
// @access  Private (Super Admin only)
const changeGroupOwner = async (req, res) => {
  try {
    const { newOwnerId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    group.owner = newOwnerId;
    await group.save();
    
    await GroupMember.findOneAndUpdate(
      { group: group._id, user: group.owner },
      { role: 'owner' }
    );
    await GroupMember.findOneAndUpdate(
      { group: group._id, user: newOwnerId },
      { role: 'owner' }
    );
    
    res.json({ success: true, message: 'Group owner changed', data: group });
  } catch (error) {
    console.error('Change group owner error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group reports
// @route   GET /api/admin/groups/:groupId/reports
// @access  Private (Admin only)
const getGroupReports = async (req, res) => {
  try {
    const GroupReport = require('../../models/groups/GroupReport');
    const reports = await GroupReport.find({ group: req.params.groupId })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get group reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGroups,
  getGroupDetails,
  approveGroup,
  rejectGroup,
  deleteGroup,
  getGroupMembers,
  removeGroupMember,
  changeGroupOwner,
  getGroupReports,
};