const express = require('express');
const { getStats, getRecentActivity } = require('../../controllers/admin/adminDashboardController');
const { adminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// All dashboard routes require admin authentication
router.use(adminAuth);

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);

module.exports = router;