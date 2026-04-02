const express = require('express');
const {
  createStory,
  getStories,
  getStoryViewers,
  reactToStory,
  deleteStory,
  viewStory
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// All routes are protected
router.use(protect);

// Main routes
router.route('/')
  .post(createStory)
  .get(getStories);

// Specific routes
router.get('/viewers/:id', getStoryViewers);
router.post('/:id/view', viewStory);
router.post('/:id/react', reactToStory);
router.delete('/:id', deleteStory);

module.exports = router;