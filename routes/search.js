const express = require('express');
const {
  globalSearch,
  searchUsers,
  searchPosts,
  searchGroups
} = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Search routes - specific first
router.get('/users', optionalAuth, searchUsers);
router.get('/posts', optionalAuth, searchPosts);
router.get('/groups', optionalAuth, searchGroups);

// Main search route - must come after specific routes
router.get('/', optionalAuth, globalSearch);

module.exports = router;