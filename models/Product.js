const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'home', 'books', 'sports', 'other'],
    default: 'other'
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  images: [{
    type: String
  }],
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'pending'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);