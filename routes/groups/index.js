const express = require('express');
const {
  createGroup,
  getMyGroups,
  discoverGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup
} = require('../../controllers/groups/groupController');
const { protect } = require('../../middleware/auth');
const router = express.Router();

router.route('/')
  .post(protect, createGroup)
  .get(protect, getMyGroups);

router.get('/discover', protect, discoverGroups);
router.post('/:groupId/join', protect, joinGroup);
router.post('/:groupId/leave', protect, leaveGroup);

router.route('/:groupId')
  .get(protect, getGroup)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);

module.exports = router;