const express = require('express');
const {
  login,
  logout,
  getMe,
} = require('../../controllers/admin/adminAuthController');
const { adminAuth } = require('../../middleware/admin/adminAuth');
const router = express.Router();

// Public route
router.post('/login', login);

// Protected routes
router.use(adminAuth);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;