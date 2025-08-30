const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getUserEvents,
  getEventStats
} = require('../controllers/events');
const { protect } = require('../middleware/auth');

// @route   GET /api/events
// @desc    Get all events with filtering and pagination
// @access  Public
router.get('/', getEvents);

// @route   POST /api/events
// @desc    Create a new event (admin only)
// @access  Private (Admin)
router.post('/', protect, createEvent);

// @route   GET /api/events/stats
// @desc    Get event statistics (admin only)
// @access  Private (Admin)
router.get('/stats', protect, getEventStats);

// @route   GET /api/events/my-events
// @desc    Get user's registered events
// @access  Private
router.get('/my-events', protect, getUserEvents);

// @route   GET /api/events/:eventId
// @desc    Get event by ID
// @access  Public
router.get('/:eventId', getEventById);

// @route   PUT /api/events/:eventId
// @desc    Update event (admin only)
// @access  Private (Admin)
router.put('/:eventId', protect, updateEvent);

// @route   DELETE /api/events/:eventId
// @desc    Delete event (admin only)
// @access  Private (Admin)
router.delete('/:eventId', protect, deleteEvent);

// @route   POST /api/events/:eventId/register
// @desc    Register for event
// @access  Private
router.post('/:eventId/register', protect, registerForEvent);

// @route   PUT /api/events/:eventId/cancel
// @desc    Cancel event registration
// @access  Private
router.put('/:eventId/cancel', protect, cancelRegistration);

module.exports = router;