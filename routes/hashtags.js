const express = require('express');
const { getTrending, getPostsByTag } = require('../controllers/hashtagController');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/trending', optionalAuth, getTrending);
router.get('/:tag/posts', optionalAuth, getPostsByTag);

module.exports = router;