const express = require('express');
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Specific routes FIRST
router.get('/conversations', protect, getConversations);
router.post('/conversations/:userId', protect, createConversation);

// Parameterized routes
router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:id/read', protect, markRead);

module.exports = router;