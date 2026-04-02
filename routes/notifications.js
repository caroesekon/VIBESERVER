const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Specific routes FIRST
router.get('/unread-count', protect, getUnreadCount);  // Add this BEFORE /read-all
router.put('/read-all', protect, markAllRead);

// Parameterized routes
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;