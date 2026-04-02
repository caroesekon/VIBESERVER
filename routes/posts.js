const express = require('express');
const {
  createPost,
  getFeed,
  getUserPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  sharePost
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Specific routes FIRST
router.get('/feed', protect, getFeed);
router.get('/user/:userId', optionalAuth, getUserPosts);

// Create post
router.post('/', protect, createPost);

// Post by ID routes
router.route('/:id')
  .get(protect, getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Post actions - These must come AFTER the /:id route
router.post('/:id/like', protect, likePost);
router.post('/:id/share', protect, sharePost);

module.exports = router;