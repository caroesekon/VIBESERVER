const Report = require('../../models/admin/Report');

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getReports = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (status && status !== 'all') filter.status = status;
    if (type && type !== '') filter.targetModel = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments(filter);
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get report details
// @route   GET /api/admin/reports/:reportId
// @access  Private (Admin only)
const getReportDetails = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('reporter', 'name email avatar')
      .populate('resolvedBy', 'name');
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Get report details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve report
// @route   PUT /api/admin/reports/:reportId/resolve
// @access  Private (Admin only)
const resolveReport = async (req, res) => {
  try {
    const { resolution } = req.body;
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    report.status = 'resolved';
    report.resolvedBy = req.admin._id;
    report.resolution = resolution || 'Resolved by admin';
    await report.save();
    
    res.json({ success: true, message: 'Report resolved', data: report });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dismiss report
// @route   PUT /api/admin/reports/:reportId/dismiss
// @access  Private (Admin only)
const dismissReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    report.status = 'dismissed';
    report.resolvedBy = req.admin._id;
    await report.save();
    
    res.json({ success: true, message: 'Report dismissed', data: report });
  } catch (error) {
    console.error('Dismiss report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get report stats
// @route   GET /api/admin/reports/stats
// @access  Private (Admin only)
const getReportStats = async (req, res) => {
  try {
    const pending = await Report.countDocuments({ status: 'pending' });
    const resolved = await Report.countDocuments({ status: 'resolved' });
    const dismissed = await Report.countDocuments({ status: 'dismissed' });
    const total = await Report.countDocuments();
    
    res.json({
      success: true,
      data: { pending, resolved, dismissed, total }
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReports,
  getReportDetails,
  resolveReport,
  dismissReport,
  getReportStats,
};