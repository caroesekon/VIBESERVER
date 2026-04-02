const mongoose = require('mongoose');

const GroupCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupPost',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupComment',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GroupComment', GroupCommentSchema);