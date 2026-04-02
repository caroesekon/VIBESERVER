const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  value: mongoose.Schema.Types.Mixed,
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);