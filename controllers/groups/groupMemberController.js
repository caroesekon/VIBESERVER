const GroupMember = require('../../models/groups/GroupMember');
const GroupJoinRequest = require('../../models/groups/GroupJoinRequest');
const Notification = require('../../models/Notification');

// @desc    Get group members
// @route   GET /api/groups/members/:groupId/members
const getMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const members = await GroupMember.find({ group: req.params.groupId })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar bio')
      .lean();

    const total = await GroupMember.countDocuments({ group: req.params.groupId });

    res.json({
      success: true,
      data: members,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get join requests (admin only)
// @route   GET /api/groups/members/:groupId/requests
const getJoinRequests = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    // Check admin
    const admin = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const requests = await GroupJoinRequest.find({ group: groupId, status: 'pending' })
      .populate('user', 'name email avatar')
      .lean();

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve join request
// @route   PUT /api/groups/members/:groupId/requests/:userId/approve
const approveRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    // Check admin
    const admin = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const request = await GroupJoinRequest.findOne({ group: groupId, user: userId, status: 'pending' });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = 'approved';
    await request.save();

    // Add user as member
    await GroupMember.create({
      group: groupId,
      user: userId,
      role: 'member'
    });

    // Send notification
    await Notification.create({
      user: userId,
      type: 'group_join_approved',
      message: `Your request to join group ${admin.group.name} has been approved`
    });

    res.json({ success: true, message: 'Request approved' });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject join request
// @route   PUT /api/groups/members/:groupId/requests/:userId/reject
const rejectRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const admin = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const request = await GroupJoinRequest.findOneAndDelete({ group: groupId, user: userId, status: 'pending' });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove member
// @route   DELETE /api/groups/members/:groupId/members/:userId
const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const admin = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Cannot remove owner
    if (member.role === 'owner') {
      return res.status(403).json({ success: false, message: 'Cannot remove owner' });
    }

    await member.deleteOne();
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Change member role
// @route   PUT /api/groups/members/:groupId/members/:userId/role
const changeRole = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body; // 'member' or 'admin'
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if current user is owner
    const owner = await GroupMember.findOne({ group: groupId, user: req.user._id, role: 'owner' });
    if (!owner) {
      return res.status(403).json({ success: false, message: 'Only owner can change roles' });
    }

    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    member.role = role;
    await member.save();

    res.json({ success: true, message: `Role changed to ${role}` });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMembers,
  getJoinRequests,
  approveRequest,
  rejectRequest,
  removeMember,
  changeRole
};