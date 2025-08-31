const express = require('express');
const { runScheduledNotifications } = require('../utils/notificationScheduler');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Run scheduled notification tasks
// @route   POST /api/v1/scheduler/notifications
// @access  Private/Admin
router.post('/notifications', protect, authorize('admin'), async (req, res) => {
  try {
    const results = await runScheduledNotifications();
    
    res.status(200).json({
      success: true,
      message: 'Scheduled notification tasks completed',
      data: results
    });
  } catch (error) {
    console.error('Error running scheduled notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run scheduled notifications',
      error: error.message
    });
  }
});

// @desc    Send event reminders only
// @route   POST /api/v1/scheduler/event-reminders
// @access  Private/Admin
router.post('/event-reminders', protect, authorize('admin'), async (req, res) => {
  try {
    const { sendEventReminders } = require('../utils/notificationScheduler');
    const results = await sendEventReminders();
    
    res.status(200).json({
      success: true,
      message: 'Event reminders sent',
      data: results
    });
  } catch (error) {
    console.error('Error sending event reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send event reminders',
      error: error.message
    });
  }
});

// @desc    Check and process completed events
// @route   POST /api/v1/scheduler/completed-events
// @access  Private/Admin
router.post('/completed-events', protect, authorize('admin'), async (req, res) => {
  try {
    const { checkCompletedEvents } = require('../utils/notificationScheduler');
    const results = await checkCompletedEvents();
    
    res.status(200).json({
      success: true,
      message: 'Completed events processed',
      data: results
    });
  } catch (error) {
    console.error('Error processing completed events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process completed events',
      error: error.message
    });
  }
});

module.exports = router;