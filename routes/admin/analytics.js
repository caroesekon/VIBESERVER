const express = require('express');
const {
  getOverview,
  getUserAnalytics,
  getGroupAnalytics,
  getUserGrowth,
} = require('../../controllers/admin/adminAnalyticsController');
const { adminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// All analytics routes require admin authentication
router.use(adminAuth);

router.get('/overview', getOverview);
router.get('/users', getUserAnalytics);
router.get('/users-growth', getUserGrowth);
router.get('/groups', getGroupAnalytics);

module.exports = router;