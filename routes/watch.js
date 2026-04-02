const express = require('express');
const {
  getVideos,
  getVideo,
  likeVideo,
  commentOnVideo,
  deleteVideo
} = require('../controllers/watchController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// All routes are protected
router.use(protect);

// Get videos with pagination and filtering
router.get('/videos', getVideos);

// Get single video
router.get('/videos/:id', getVideo);

// Like/unlike video
router.post('/videos/:id/like', likeVideo);

// Comment on video
router.post('/videos/:id/comment', commentOnVideo);

// Delete video
router.delete('/videos/:id', deleteVideo);

module.exports = router;