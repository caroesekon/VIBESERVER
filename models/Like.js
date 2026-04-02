const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }
}, {
  timestamps: true
});

// Ensure either post or comment is present
LikeSchema.pre('validate', function(next) {
  if (!this.post && !this.comment) {
    next(new Error('Like must reference either a post or a comment'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Like', LikeSchema);