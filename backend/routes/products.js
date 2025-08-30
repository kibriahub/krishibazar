const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview
} = require('../controllers/products');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('farmer', 'vendor'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('farmer', 'vendor', 'admin'), updateProduct)
  .delete(protect, authorize('farmer', 'vendor', 'admin'), deleteProduct);

router.route('/:id/reviews').post(protect, authorize('consumer'), addProductReview);

module.exports = router;