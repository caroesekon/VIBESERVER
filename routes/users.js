const express = require('express');
const {
  getProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  searchUsers,
  getSuggestions,
  getUserPhotos
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Specific routes FIRST
router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getSuggestions);
router.put('/avatar', protect, updateAvatar);
router.put('/cover', protect, updateCover);
router.put('/profile', protect, updateProfile);

// Parameterized routes LAST
router.get('/profile/:id', protect, getProfile);
router.get('/:userId/photos', protect, getUserPhotos);  // NEW endpoint

module.exports = router;