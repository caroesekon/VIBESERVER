const mongoose = require('mongoose');

const BanListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isPermanent: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  unbannedAt: {
    type: Date,
    default: null
  },
  unbannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BanList', BanListSchema);