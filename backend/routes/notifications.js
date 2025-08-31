const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendCustomNotification
} = require('../controllers/notifications');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
router.get('/', protect, getUserNotifications);

// @desc    Get unread notification count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, getUnreadCount);

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, markAsRead);

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
router.put('/read-all', protect, markAllAsRead);

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
router.delete('/:id', protect, deleteNotification);

// @desc    Send custom notification (Admin only)
// @route   POST /api/v1/notifications/send
// @access  Private/Admin
router.post('/send', protect, authorize('admin'), sendCustomNotification);

module.exports = router;