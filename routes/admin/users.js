const express = require('express');
const {
  getUsers,
  getUserDetails,
  banUser,
  unbanUser,
  deleteUser,
} = require('../../controllers/admin/adminUserController');
const { adminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// All user management routes require admin authentication
router.use(adminAuth);

router.get('/', getUsers);
router.get('/:userId', getUserDetails);
router.put('/:userId/ban', banUser);
router.put('/:userId/unban', unbanUser);
router.delete('/:userId', deleteUser);

module.exports = router;