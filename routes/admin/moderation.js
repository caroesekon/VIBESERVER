const express = require('express');
const {
  getQueue,
  removeContent,
  restoreContent,
} = require('../../controllers/admin/adminModerationController');
const { adminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// All moderation routes require admin authentication
router.use(adminAuth);

router.get('/queue', getQueue);
router.post('/:type/:id/remove', removeContent);
router.post('/:type/:id/restore', restoreContent);

module.exports = router;