const Event = require('../models/Event');
const User = require('../models/User');
const { sendEventNotification } = require('./notifications');

// Create a new event (admin only)
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      location,
      dateTime,
      capacity,
      registrationFee,
      images,
      tags,
      requirements,
      contactInfo
    } = req.body;

    // Check if user has permission to create events (admin, farmer, or vendor)
    if (!['admin', 'farmer', 'vendor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Only admins, farmers, and vendors can create events.' });
    }

    // Validate required fields
    if (!title || !description || !location || !dateTime || !capacity) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate dates
    const startDate = new Date(dateTime.startDate);
    const endDate = new Date(dateTime.endDate);
    const now = new Date();

    if (startDate <= now) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const event = new Event({
      title,
      description,
      eventType: eventType || 'farmers_market',
      location,
      dateTime,
      organizer: req.user.id,
      capacity,
      registrationFee: registrationFee || 0,
      status: req.body.status || 'published', // Default to published for visibility
      images: images || [],
      tags: tags || [],
      requirements,
      contactInfo
    });

    await event.save();
    await event.populate('organizer', 'name email');

    // Send event announcement notification
    try {
      await sendEventNotification('event_announced', event._id, {
        eventTitle: event.title,
        eventId: event._id,
        startDate: event.dateTime.startDate,
        location: `${event.location.city}, ${event.location.state}`,
        actionUrl: `/events/${event._id}`,
        imageUrl: event.images && event.images.length > 0 ? event.images[0] : null
      });
    } catch (notificationError) {
      console.error('Failed to send event announcement notification:', notificationError);
      // Don't fail event creation if notification fails
    }

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all events with filtering and pagination
const getEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      eventType,
      city,
      status,
      upcoming,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    // Build query filters
    if (eventType) {
      query.eventType = eventType;
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (status) {
      query.status = status;
    } else {
      // Default to published events for public access
      query.status = { $in: ['published', 'ongoing'] };
    }

    if (upcoming === 'true') {
      query['dateTime.startDate'] = { $gte: new Date() };
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ 'dateTime.startDate': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalEvents = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalEvents / parseInt(limit));

    res.json({
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalEvents,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('organizer', 'name email phone')
      .populate('attendees.user', 'name email')
      .populate('vendors.user', 'name email businessName');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });

  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update event (admin only)
const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validate dates if being updated
    if (updateData.dateTime) {
      const startDate = new Date(updateData.dateTime.startDate);
      const endDate = new Date(updateData.dateTime.endDate);

      if (endDate <= startDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');

    // Send event completion notification if status changed to completed
    if (updateData.status === 'completed' && event.status !== 'completed') {
      try {
        await sendEventNotification('event_completed', updatedEvent._id, {
          eventTitle: updatedEvent.title,
          eventId: updatedEvent._id,
          actionUrl: `/events/${updatedEvent._id}`,
          imageUrl: updatedEvent.images && updatedEvent.images.length > 0 ? updatedEvent.images[0] : null
        });
      } catch (notificationError) {
        console.error('Failed to send event completion notification:', notificationError);
      }
    }

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete event (admin only)
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event has attendees
    if (event.attendees.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete event with registered attendees. Cancel the event instead.' 
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register for event
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { paymentMethod } = req.body; // 'online' or 'cod' (Cash on Delivery)
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is available for registration
    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not available for registration' });
    }

    if (new Date() >= event.dateTime.startDate) {
      return res.status(400).json({ message: 'Registration closed. Event has already started.' });
    }

    if (event.capacity.currentAttendees >= event.capacity.maxAttendees) {
      return res.status(400).json({ message: 'Event is fully booked' });
    }

    // Check if user is already registered
    const existingRegistration = event.attendees.find(
      attendee => attendee.user.toString() === userId && attendee.status !== 'cancelled'
    );

    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Determine payment status based on fee and payment method
    let paymentStatus = 'paid'; // Default for free events
    if (event.registrationFee > 0) {
      if (paymentMethod === 'cod') {
        paymentStatus = 'paid'; // COD is considered successful payment
      } else {
        paymentStatus = 'pending'; // Online payment needs processing
      }
    }

    // Add user to attendees
    event.attendees.push({
      user: userId,
      paymentStatus,
      paymentMethod: event.registrationFee > 0 ? (paymentMethod || 'cod') : 'free'
    });

    await event.save();
    await event.populate('attendees.user', 'name email');

    const successMessage = event.registrationFee > 0 && paymentMethod === 'cod' 
      ? 'Successfully registered! Payment will be collected on delivery/at the event.'
      : 'Successfully registered for the event!';

    res.json({
      message: successMessage,
      registration: event.attendees[event.attendees.length - 1]
    });

  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel event registration
const cancelRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendeeIndex = event.attendees.findIndex(
      attendee => attendee.user.toString() === userId && attendee.status !== 'cancelled'
    );

    if (attendeeIndex === -1) {
      return res.status(400).json({ message: 'You are not registered for this event' });
    }

    // Check if cancellation is allowed (e.g., not too close to event date)
    const hoursUntilEvent = (event.dateTime.startDate - new Date()) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24) {
      return res.status(400).json({ 
        message: 'Cannot cancel registration less than 24 hours before the event' 
      });
    }

    // Update attendee status
    event.attendees[attendeeIndex].status = 'cancelled';
    await event.save();

    res.json({ message: 'Registration cancelled successfully' });

  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's registered events
const getUserEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'registered' } = req.query;

    const events = await Event.find({
      'attendees.user': userId,
      'attendees.status': status
    })
      .populate('organizer', 'name email')
      .sort({ 'dateTime.startDate': 1 });

    res.json({ events });

  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event statistics (admin only)
const getEventStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ status: 'published' });
    const upcomingEvents = await Event.countDocuments({
      status: 'published',
      'dateTime.startDate': { $gte: new Date() }
    });
    const completedEvents = await Event.countDocuments({ status: 'completed' });

    // Get total registrations
    const eventsWithAttendees = await Event.aggregate([
      { $unwind: '$attendees' },
      { $match: { 'attendees.status': { $in: ['registered', 'attended'] } } },
      { $group: { _id: null, totalRegistrations: { $sum: 1 } } }
    ]);

    const totalRegistrations = eventsWithAttendees[0]?.totalRegistrations || 0;

    // Get events by type
    const eventsByType = await Event.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalEvents,
      publishedEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      eventsByType
    });

  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getUserEvents,
  getEventStats
};