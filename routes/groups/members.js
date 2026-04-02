const express = require('express');
const {
  getMembers,
  getJoinRequests,
  approveRequest,
  rejectRequest,
  removeMember,
  changeRole
} = require('../../controllers/groups/groupMemberController');
const { protect } = require('../../middleware/auth');
const router = express.Router();

router.get('/:groupId/members', protect, getMembers);
router.get('/:groupId/requests', protect, getJoinRequests);
router.put('/:groupId/requests/:userId/approve', protect, approveRequest);
router.put('/:groupId/requests/:userId/reject', protect, rejectRequest);
router.delete('/:groupId/members/:userId', protect, removeMember);
router.put('/:groupId/members/:userId/role', protect, changeRole);

module.exports = router;