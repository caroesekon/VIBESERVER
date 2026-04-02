const Group = require('../../models/groups/Group');
const GroupMember = require('../../models/groups/GroupMember');
const GroupJoinRequest = require('../../models/groups/GroupJoinRequest');
const Notification = require('../../models/Notification');

// @desc    Create a group
// @route   POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name, description, privacy, topics } = req.body;
    const group = await Group.create({
      name,
      description,
      privacy: privacy || 'public',
      topics: topics || [],
      owner: req.user._id,
      admins: [req.user._id],
      members: [req.user._id]
    });

    // Add creator as member
    await GroupMember.create({
      group: group._id,
      user: req.user._id,
      role: 'owner'
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get groups the user belongs to
// @route   GET /api/groups
const getMyGroups = async (req, res) => {
  try {
    const memberships = await GroupMember.find({ user: req.user._id }).select('group');
    const groupIds = memberships.map(m => m.group);
    const groups = await Group.find({ _id: { $in: groupIds } });
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Discover public groups
// @route   GET /api/groups/discover
const discoverGroups = async (req, res) => {
  try {
    const groups = await Group.find({ privacy: 'public' })
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Discover groups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get group details
// @route   GET /api/groups/:groupId
const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check membership for private groups
    if (group.privacy === 'private') {
      const member = await GroupMember.findOne({ group: group._id, user: req.user._id });
      if (!member) {
        return res.status(403).json({ success: false, message: 'Private group, not a member' });
      }
    }

    res.json({ success: true, data: group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:groupId
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin or owner
    const membership = await GroupMember.findOne({ group: group._id, user: req.user._id });
    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, description, privacy, topics } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (privacy) group.privacy = privacy;
    if (topics) group.topics = topics;

    await group.save();
    res.json({ success: true, data: group });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:groupId
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can delete group' });
    }

    await group.deleteOne();
    // Clean up related data: members, posts, etc.
    await GroupMember.deleteMany({ group: group._id });
    // Also delete posts, events, etc. (not shown for brevity)
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Join group
// @route   POST /api/groups/:groupId/join
const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if already a member
    const existingMember = await GroupMember.findOne({ group: group._id, user: req.user._id });
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    if (group.privacy === 'public') {
      // Auto-approve
      await GroupMember.create({
        group: group._id,
        user: req.user._id,
        role: 'member'
      });
      res.json({ success: true, message: 'Joined group' });
    } else {
      // Private group: send join request
      await GroupJoinRequest.create({
        group: group._id,
        user: req.user._id,
        status: 'pending'
      });
      res.json({ success: true, message: 'Join request sent' });
    }
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Leave group
// @route   POST /api/groups/:groupId/leave
const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    await GroupMember.findOneAndDelete({ group: group._id, user: req.user._id });
    res.json({ success: true, message: 'Left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  discoverGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup
};