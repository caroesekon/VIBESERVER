const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'post', 'group', 'report'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);