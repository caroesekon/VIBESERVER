const express = require('express');
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getRequests,
  getFriends,
  removeFriend,
  getFriendStatus
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Specific routes FIRST
router.get('/status/:userId', protect, getFriendStatus);
router.get('/requests', protect, getRequests);
router.get('/list', protect, getFriends);

// Parameterized routes
router.post('/request/:userId', protect, sendRequest);
router.put('/request/:requestId/accept', protect, acceptRequest);
router.put('/request/:requestId/reject', protect, rejectRequest);
router.delete('/:friendId', protect, removeFriend);

module.exports = router;