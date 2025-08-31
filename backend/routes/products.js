const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getMyProducts,
  uploadProductImages,
  removeProductImage
} = require('../controllers/products');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple, uploadSingle } = require('../middleware/upload');

router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('farmer', 'vendor', 'admin'), uploadMultiple, createProduct);

// Route for farmers/vendors to get their own products
router.route('/my-products').get(protect, authorize('farmer', 'vendor', 'admin'), getMyProducts);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('farmer', 'vendor', 'admin'), uploadMultiple, updateProduct)
  .delete(protect, authorize('farmer', 'vendor', 'admin'), deleteProduct);

// Route for uploading additional images to existing products
router.route('/:id/images').put(protect, authorize('farmer', 'vendor', 'admin'), uploadMultiple, uploadProductImages);

// Route for removing specific images from products
router.route('/:id/images/:imageIndex').delete(protect, authorize('farmer', 'vendor', 'admin'), removeProductImage);

router.route('/:id/reviews').post(protect, authorize('consumer'), addProductReview);

module.exports = router;