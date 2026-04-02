const express = require('express');
const { getPublicSettings } = require('../controllers/admin/adminSettingsController');
const router = express.Router();

// Public route - no authentication required
router.get('/public', getPublicSettings);

module.exports = router;