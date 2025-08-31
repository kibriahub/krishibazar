const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders: getUserOrders,
  getOrder: getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  bulkUpdateOrderStatus,
  updateOrderPriority,
  getSellerOrders,
  getOrderTracking,
  getOrderHistory,
  updateDeliveryTracking,
  getDeliveryTimeline,
  approveVendorCODPayment,
  approveAdminCODPayment,
  getCODOrdersPendingApproval,
  // Admin CRUD operations
  getAllOrdersAdmin,
  updateOrderAdmin,
  deleteOrderAdmin,
  createOrderAdmin
} = require('../controllers/orders');
const { protect } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, createOrder);

// @route   GET /api/orders
// @desc    Get user's orders with pagination
// @access  Private
router.get('/', protect, getUserOrders);

// @route   GET /api/orders/stats
// @desc    Get order statistics (admin only)
// @access  Private (Admin)
router.get('/stats', protect, getOrderStats);

// @route   GET /api/orders/:orderId
// @desc    Get order by ID
// @access  Private
router.get('/:orderId', protect, getOrderById);

// @route   PUT /api/orders/:orderId/status
// @desc    Update order status
// @access  Private (Admin/Vendor)
router.put('/:orderId/status', protect, updateOrderStatus);

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put('/:orderId/cancel', protect, cancelOrder);

// Bulk operations
router.put('/bulk-update', protect, bulkUpdateOrderStatus);
router.put('/:orderId/priority', protect, updateOrderPriority);

// Seller specific routes
router.get('/seller/orders', protect, getSellerOrders);

// Order tracking and history
router.get('/history', protect, getOrderHistory);
router.get('/:orderId/tracking', protect, getOrderTracking);
router.get('/:orderId/timeline', protect, getDeliveryTimeline);
router.put('/:orderId/delivery-tracking', protect, updateDeliveryTracking);

// COD approval routes
router.get('/cod-pending-approval', protect, getCODOrdersPendingApproval);
router.put('/:orderId/approve-vendor-cod', protect, approveVendorCODPayment);
router.put('/:orderId/approve-admin-cod', protect, approveAdminCODPayment);

// Admin CRUD routes
router.get('/admin/all', protect, getAllOrdersAdmin);
router.post('/admin/create', protect, createOrderAdmin);
router.put('/admin/:orderId', protect, updateOrderAdmin);
router.delete('/admin/:orderId', protect, deleteOrderAdmin);

module.exports = router;