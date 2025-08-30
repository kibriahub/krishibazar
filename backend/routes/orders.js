const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} = require('../controllers/orders');
const { protect: auth } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', auth, createOrder);

// @route   GET /api/orders
// @desc    Get user's orders with pagination
// @access  Private
router.get('/', auth, getUserOrders);

// @route   GET /api/orders/stats
// @desc    Get order statistics (admin only)
// @access  Private (Admin)
router.get('/stats', auth, getOrderStats);

// @route   GET /api/orders/:orderId
// @desc    Get order by ID
// @access  Private
router.get('/:orderId', auth, getOrderById);

// @route   PUT /api/orders/:orderId/status
// @desc    Update order status (admin only)
// @access  Private (Admin)
router.put('/:orderId/status', auth, updateOrderStatus);

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put('/:orderId/cancel', auth, cancelOrder);

module.exports = router;