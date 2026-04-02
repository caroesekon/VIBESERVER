const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/marketplaceController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/products', protect, getProducts);
router.get('/my-products', protect, getMyProducts);
router.get('/products/:id', protect, getProduct);
router.post('/products', protect, createProduct);
router.put('/products/:id', protect, updateProduct);
router.delete('/products/:id', protect, deleteProduct);

module.exports = router;