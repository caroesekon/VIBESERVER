const Group = require('../models/groups/Group');
const GroupMember = require('../models/groups/GroupMember');
const GroupPost = require('../models/groups/GroupPost');

// Get all groups where user is a member
const getUserGroups = async (userId) => {
  const memberships = await GroupMember.find({ user: userId }).select('group');
  const groupIds = memberships.map(m => m.group);
  return Group.find({ _id: { $in: groupIds } });
};

// Add member to group
const addMember = async (groupId, userId, role = 'member') => {
  const existing = await GroupMember.findOne({ group: groupId, user: userId });
  if (existing) return existing;

  const member = await GroupMember.create({ group: groupId, user: userId, role });
  await Group.findByIdAndUpdate(groupId, { $addToSet: { members: userId } });
  return member;
};

// Remove member from group
const removeMember = async (groupId, userId) => {
  await GroupMember.findOneAndDelete({ group: groupId, user: userId });
  await Group.findByIdAndUpdate(groupId, { $pull: { members: userId } });
};

// Create a post in a group
const createGroupPost = async (groupId, userId, content, images = []) => {
  const post = await GroupPost.create({ group: groupId, user: userId, content, images });
  return post.populate('user', 'name avatar');
};

// Get group posts with pagination
const getGroupPosts = async (groupId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const posts = await GroupPost.find({ group: groupId })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar');
  const total = await GroupPost.countDocuments({ group: groupId });
  return { posts, total };
};

module.exports = {
  getUserGroups,
  addMember,
  removeMember,
  createGroupPost,
  getGroupPosts,
};