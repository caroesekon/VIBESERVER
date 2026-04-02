const GroupReport = require('../../models/groups/GroupReport');
const GroupRule = require('../../models/groups/GroupRule');
const GroupMember = require('../../models/groups/GroupMember');
const Notification = require('../../models/Notification');

// @desc    Report a group
// @route   POST /api/groups/moderation/:groupId/report
const reportGroup = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const groupId = req.params.groupId;

    const existing = await GroupReport.findOne({ group: groupId, reportedBy: req.user._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reported this group' });
    }

    await GroupReport.create({
      group: groupId,
      reportedBy: req.user._id,
      reason,
      description
    });

    res.json({ success: true, message: 'Group reported' });
  } catch (error) {
    console.error('Report group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get group reports (admin only)
// @route   GET /api/groups/moderation/:groupId/reports
const getReports = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const admin = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const reports = await GroupReport.find({ group: groupId })
      .populate('reportedBy', 'name email')
      .lean();

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Resolve a report
// @route   PUT /api/groups/moderation/:groupId/reports/:reportId/resolve
const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await GroupReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const admin = await GroupMember.findOne({ group: report.group, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    report.status = 'resolved';
    report.resolvedBy = req.user._id;
    await report.save();

    res.json({ success: true, message: 'Report resolved' });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add group rule
// @route   POST /api/groups/moderation/:groupId/rules
const addRule = async (req, res) => {
  try {
    const { title, description, order } = req.body;
    const groupId = req.params.groupId;

    const admin = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const rule = await GroupRule.create({
      group: groupId,
      title,
      description,
      order: order || 0
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    console.error('Add rule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update group rule
// @route   PUT /api/groups/moderation/:groupId/rules/:ruleId
const updateRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const rule = await GroupRule.findById(ruleId);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const admin = await GroupMember.findOne({ group: rule.group, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, description, order } = req.body;
    if (title) rule.title = title;
    if (description !== undefined) rule.description = description;
    if (order !== undefined) rule.order = order;

    await rule.save();
    res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete group rule
// @route   DELETE /api/groups/moderation/:groupId/rules/:ruleId
const deleteRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const rule = await GroupRule.findById(ruleId);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const admin = await GroupMember.findOne({ group: rule.group, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await rule.deleteOne();
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  reportGroup,
  getReports,
  resolveReport,
  addRule,
  updateRule,
  deleteRule
};