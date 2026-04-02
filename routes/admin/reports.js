const express = require('express');
const {
  getReports,
  getReportDetails,
  resolveReport,
  dismissReport,
  getReportStats,
} = require('../../controllers/admin/adminReportController');
const { adminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// All report routes require admin authentication
router.use(adminAuth);

router.get('/', getReports);
router.get('/stats', getReportStats);
router.get('/:reportId', getReportDetails);
router.put('/:reportId/resolve', resolveReport);
router.put('/:reportId/dismiss', dismissReport);

module.exports = router;