const Event = require('../models/Event');
const { sendEventNotification } = require('../controllers/notifications');

// Send event reminders for events starting within the next 24 hours
const sendEventReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Find events starting within the next 24 hours that haven't been reminded yet
    const upcomingEvents = await Event.find({
      'dateTime.startDate': {
        $gte: now,
        $lte: tomorrow
      },
      status: { $in: ['published', 'ongoing'] },
      reminderSent: { $ne: true }
    }).populate('organizer', 'name email');

    console.log(`Found ${upcomingEvents.length} events for reminder notifications`);

    for (const event of upcomingEvents) {
      try {
        await sendEventNotification('event_reminder', event._id, {
          eventTitle: event.title,
          eventId: event._id,
          startDate: event.dateTime.startDate,
          location: `${event.location.city}, ${event.location.state}`,
          actionUrl: `/events/${event._id}`,
          imageUrl: event.images && event.images.length > 0 ? event.images[0] : null
        });

        // Mark reminder as sent
        await Event.findByIdAndUpdate(event._id, { reminderSent: true });
        
        console.log(`Sent reminder for event: ${event.title}`);
      } catch (error) {
        console.error(`Failed to send reminder for event ${event._id}:`, error);
      }
    }

    return {
      success: true,
      remindersSent: upcomingEvents.length
    };

  } catch (error) {
    console.error('Error sending event reminders:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check for completed events and send completion notifications
const checkCompletedEvents = async () => {
  try {
    const now = new Date();
    
    // Find events that have ended but status is not yet 'completed'
    const endedEvents = await Event.find({
      'dateTime.endDate': { $lt: now },
      status: { $in: ['published', 'ongoing'] },
      completionNotificationSent: { $ne: true }
    });

    console.log(`Found ${endedEvents.length} events to mark as completed`);

    for (const event of endedEvents) {
      try {
        // Update event status to completed
        await Event.findByIdAndUpdate(event._id, { 
          status: 'completed',
          completionNotificationSent: true
        });

        // Send completion notification
        await sendEventNotification('event_completed', event._id, {
          eventTitle: event.title,
          eventId: event._id,
          actionUrl: `/events/${event._id}`,
          imageUrl: event.images && event.images.length > 0 ? event.images[0] : null
        });

        console.log(`Marked event as completed: ${event.title}`);
      } catch (error) {
        console.error(`Failed to process completed event ${event._id}:`, error);
      }
    }

    return {
      success: true,
      eventsCompleted: endedEvents.length
    };

  } catch (error) {
    console.error('Error checking completed events:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Run all scheduled notification tasks
const runScheduledNotifications = async () => {
  console.log('Running scheduled notification tasks...');
  
  const reminderResults = await sendEventReminders();
  const completionResults = await checkCompletedEvents();
  
  console.log('Scheduled notification tasks completed:', {
    reminders: reminderResults,
    completions: completionResults
  });
  
  return {
    reminders: reminderResults,
    completions: completionResults
  };
};

module.exports = {
  sendEventReminders,
  checkCompletedEvents,
  runScheduledNotifications
};