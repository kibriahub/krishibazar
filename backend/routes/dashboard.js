const express = require('express');
const router = express.Router();
const {
  getVendorDashboard,
  getConsumerDashboard,
  getVendorAnalytics
} = require('../controllers/dashboard');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/dashboard/vendor
// @desc    Get farmer/vendor dashboard data
// @access  Private (Farmer/Vendor)
router.get('/vendor', authorize('farmer', 'vendor'), getVendorDashboard);

// @route   GET /api/dashboard/vendor/analytics
// @desc    Get vendor earnings analytics
// @access  Private (Farmer/Vendor)
router.get('/vendor/analytics', authorize('farmer', 'vendor'), getVendorAnalytics);

// @route   GET /api/dashboard/consumer
// @desc    Get consumer dashboard data
// @access  Private (Consumer)
router.get('/consumer', authorize('consumer'), getConsumerDashboard);

module.exports = router;