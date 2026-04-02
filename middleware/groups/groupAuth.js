const GroupMember = require('../../models/groups/GroupMember');

// Check if user is a member of the group
const isGroupMember = async (req, res, next) => {
  const groupId = req.params.groupId || req.params.id;
  const userId = req.user._id;

  try {
    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }
    req.groupMember = member;
    next();
  } catch (error) {
    console.error('Group member check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if user is admin or owner of the group
const isGroupAdmin = async (req, res, next) => {
  const groupId = req.params.groupId || req.params.id;
  const userId = req.user._id;

  try {
    const member = await GroupMember.findOne({ group: groupId, user: userId });
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }
    req.groupMember = member;
    next();
  } catch (error) {
    console.error('Group admin check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { isGroupMember, isGroupAdmin };