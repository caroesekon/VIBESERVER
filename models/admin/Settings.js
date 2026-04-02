const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'text'],
    default: 'string'
  },
  description: {
    type: String,
    default: ''
  },
  group: {
    type: String,
    enum: ['general', 'appearance', 'legal', 'features', 'email', 'security'],
    default: 'general'
  },
  isPublic: {
    type: Boolean,
    default: false // Whether this setting is exposed to public API
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);