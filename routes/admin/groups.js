const express = require('express');
const {
  getGroups,
  getGroupDetails,
  approveGroup,
  rejectGroup,
  deleteGroup,
  getGroupMembers,
  removeGroupMember,
  changeGroupOwner,
  getGroupReports,
} = require('../../controllers/admin/adminGroupController');
const { adminAuth, superAdminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// All group management routes require admin authentication
router.use(adminAuth);

router.get('/', getGroups);
router.get('/:groupId', getGroupDetails);
router.get('/:groupId/members', getGroupMembers);
router.get('/:groupId/reports', getGroupReports);

router.put('/:groupId/approve', approveGroup);
router.put('/:groupId/reject', rejectGroup);
router.put('/:groupId/owner', superAdminAuth, changeGroupOwner);

router.delete('/:groupId', deleteGroup);
router.delete('/:groupId/members/:userId', removeGroupMember);

module.exports = router;