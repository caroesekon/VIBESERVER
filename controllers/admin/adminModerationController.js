const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const Group = require('../../models/groups/Group');

// @desc    Get moderation queue
// @route   GET /api/admin/moderation/queue
// @access  Private (Admin only)
const getQueue = async (req, res) => {
  try {
    const reportedPosts = await Post.find({ 'reports.0': { $exists: true } })
      .populate('user', 'name email')
      .limit(20)
      .sort({ createdAt: -1 });
    
    const reportedComments = await Comment.find({ 'reports.0': { $exists: true } })
      .populate('user', 'name email')
      .limit(20)
      .sort({ createdAt: -1 });
    
    const reportedGroups = await Group.find({ isActive: false })
      .populate('owner', 'name email')
      .limit(20)
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: { 
        posts: reportedPosts, 
        comments: reportedComments,
        groups: reportedGroups
      } 
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove content
// @route   POST /api/admin/moderation/:type/:id/remove
// @access  Private (Admin only)
const removeContent = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { reason } = req.body;
    
    let result;
    if (type === 'post') {
      result = await Post.findByIdAndDelete(id);
    } else if (type === 'comment') {
      result = await Comment.findByIdAndDelete(id);
    } else if (type === 'group') {
      result = await Group.findByIdAndUpdate(id, { isActive: false, removalReason: reason });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    
    res.json({ success: true, message: `${type} removed successfully` });
  } catch (error) {
    console.error('Remove content error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore content
// @route   POST /api/admin/moderation/:type/:id/restore
// @access  Private (Admin only)
const restoreContent = async (req, res) => {
  try {
    const { type, id } = req.params;
    
    let result;
    if (type === 'group') {
      result = await Group.findByIdAndUpdate(id, { isActive: true, removalReason: null });
    } else {
      return res.status(400).json({ success: false, message: 'Only groups can be restored' });
    }
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    
    res.json({ success: true, message: `${type} restored successfully` });
  } catch (error) {
    console.error('Restore content error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getQueue, removeContent, restoreContent };