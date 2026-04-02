const express = require('express');
const { getSettings, updateSettings } = require('../../controllers/admin/adminSettingsController');
const { adminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// All settings routes require admin authentication
router.use(adminAuth);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;