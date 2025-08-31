const express = require('express');
const {
  checkStockAvailability,
  reserveStock,
  confirmStockReservation,
  releaseStockReservation,
  getLowStockProducts,
  cleanExpiredReservations
} = require('../controllers/inventory');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/check-availability', checkStockAvailability);

// Protected routes
router.use(protect);

// User routes
router.post('/reserve', reserveStock);
router.post('/confirm-reservation', confirmStockReservation);
router.post('/release-reservation', releaseStockReservation);

// Admin routes
router.get('/low-stock', authorize('admin'), getLowStockProducts);
router.post('/clean-expired', authorize('admin'), cleanExpiredReservations);

module.exports = router;