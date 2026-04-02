const express = require('express');
const {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  likePost,
  pinPost
} = require('../../controllers/groups/groupPostController');
const { protect } = require('../../middleware/auth');
const router = express.Router();

router.route('/:groupId/posts')
  .post(protect, createPost)
  .get(protect, getPosts);

router.route('/:groupId/posts/:postId')
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:groupId/posts/:postId/like', protect, likePost);
router.put('/:groupId/posts/:postId/pin', protect, pinPost);

module.exports = router;