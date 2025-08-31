const Notification = require('../models/Notification');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Event = require('../models/Event');
const socketService = require('../services/socketService');

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('metadata.orderId', 'orderNumber status totalAmount')
      .populate('metadata.productId', 'name images price')
      .populate('metadata.eventId', 'title startDate location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Transform notifications to match frontend interface
    const transformedNotifications = notifications.map(notification => ({
      ...notification,
      id: notification._id,
      read: notification.isRead
    }));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: transformedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Create notification (internal function)
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.createNotification({
      ...notificationData,
      deliveryStatus: 'sent',
      sentAt: new Date()
    });
    
    // Send real-time notification via Socket.IO
    socketService.sendNotification(notification);
    
    console.log(`Notification created: ${notification.type} for user ${notification.recipient}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Send order notification
const sendOrderNotification = async (orderId, type, customMessage = null) => {
  try {
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    if (!order) {
      throw new Error('Order not found');
    }

    const notificationMessages = {
      order_confirmed: {
        title: 'Order Confirmed',
        message: customMessage || `Your order #${order.orderNumber} has been confirmed and is being processed.`
      },
      order_shipped: {
        title: 'Order Shipped',
        message: customMessage || `Great news! Your order #${order.orderNumber} has been shipped and is on its way.`
      },
      order_delivered: {
        title: 'Order Delivered',
        message: customMessage || `Your order #${order.orderNumber} has been delivered successfully. Enjoy your fresh produce!`
      },
      order_cancelled: {
        title: 'Order Cancelled',
        message: customMessage || `Your order #${order.orderNumber} has been cancelled. If you have any questions, please contact support.`
      }
    };

    const notificationContent = notificationMessages[type];
    if (!notificationContent) {
      throw new Error('Invalid notification type');
    }

    await createNotification({
      recipient: order.user._id,
      type,
      title: notificationContent.title,
      message: notificationContent.message,
      priority: type === 'order_cancelled' ? 'high' : 'medium',
      metadata: {
        orderId: order._id,
        actionUrl: `/orders/${order._id}`
      }
    });

    // Also notify vendor if order is delivered (for payment)
    if (type === 'order_delivered' && order.items.length > 0) {
      const vendorIds = [...new Set(order.items.map(item => item.product.vendor).filter(Boolean))];
      
      for (const vendorId of vendorIds) {
        await createNotification({
          recipient: vendorId,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment for order #${order.orderNumber} has been processed.`,
          priority: 'medium',
          metadata: {
            orderId: order._id,
            actionUrl: `/vendor/orders/${order._id}`
          }
        });
      }
    }

  } catch (error) {
    console.error('Error sending order notification:', error);
    throw error;
  }
};

// Send product notification
const sendProductNotification = async (productId, type, customMessage = null) => {
  try {
    const product = await Product.findById(productId).populate('vendor', 'name');
    
    if (!product) {
      throw new Error('Product not found');
    }

    const notificationMessages = {
      product_back_in_stock: {
        title: 'Back in Stock!',
        message: customMessage || `Good news! ${product.name} is back in stock. Get it before it runs out again!`
      },
      new_product_arrival: {
        title: 'New Product Available',
        message: customMessage || `Check out the new product: ${product.name} from ${product.vendor.name}`
      },
      low_inventory_warning: {
        title: 'Low Inventory Alert',
        message: customMessage || `Warning: ${product.name} is running low in stock (${product.stock} remaining)`
      }
    };

    const notificationContent = notificationMessages[type];
    if (!notificationContent) {
      throw new Error('Invalid notification type');
    }

    // For back in stock notifications, find users who might be interested
    if (type === 'product_back_in_stock') {
      // This would typically involve finding users who have the product in wishlist
      // For now, we'll skip this and let it be called explicitly
      return;
    }

    // For new product arrivals, notify followers of the vendor
    if (type === 'new_product_arrival') {
      // This would involve finding vendor followers
      // For now, we'll create a general notification mechanism
      return;
    }

    // For low inventory, notify the vendor
    if (type === 'low_inventory_warning') {
      await createNotification({
        recipient: product.vendor._id,
        type,
        title: notificationContent.title,
        message: notificationContent.message,
        priority: 'high',
        metadata: {
          productId: product._id,
          actionUrl: `/vendor/products/${product._id}`
        }
      });
    }

  } catch (error) {
    console.error('Error sending product notification:', error);
    throw error;
  }
};

// Send event notification
const sendEventNotification = async (eventId, type, customMessage = null) => {
  try {
    const event = await Event.findById(eventId).populate('organizer', 'name');
    
    if (!event) {
      throw new Error('Event not found');
    }

    const notificationMessages = {
      event_announced: {
        title: 'New Event Announced',
        message: customMessage || `New event: ${event.title} has been announced. Check it out!`
      },
      event_reminder: {
        title: 'Event Reminder',
        message: customMessage || `Reminder: ${event.title} is starting soon on ${new Date(event.startDate).toLocaleDateString()}`
      },
      event_completed: {
        title: 'Event Completed',
        message: customMessage || `Thank you for participating in ${event.title}. We hope you enjoyed it!`
      }
    };

    const notificationContent = notificationMessages[type];
    if (!notificationContent) {
      throw new Error('Invalid notification type');
    }

    // For event announcements, notify all users in the area
    if (type === 'event_announced') {
      // This would involve finding users in the event's location
      // For now, we'll skip this and let it be called explicitly
      return;
    }

    // For event reminders and completion, notify registered users
    if (type === 'event_reminder' || type === 'event_completed') {
      const registeredUsers = event.registrations || [];
      
      for (const userId of registeredUsers) {
        await createNotification({
          recipient: userId,
          type,
          title: notificationContent.title,
          message: notificationContent.message,
          priority: type === 'event_reminder' ? 'high' : 'medium',
          metadata: {
            eventId: event._id,
            actionUrl: `/events/${event._id}`
          }
        });
      }
    }

  } catch (error) {
    console.error('Error sending event notification:', error);
    throw error;
  }
};

// Send custom notification
const sendCustomNotification = async (req, res) => {
  try {
    const { recipients, type, title, message, priority = 'medium', metadata = {} } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required'
      });
    }

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and message are required'
      });
    }

    const notifications = [];
    for (const recipientId of recipients) {
      const notification = await createNotification({
        recipient: recipientId,
        type,
        title,
        message,
        priority,
        metadata
      });
      notifications.push(notification);
    }

    res.json({
      success: true,
      message: `${notifications.length} notifications sent successfully`,
      data: notifications
    });
  } catch (error) {
    console.error('Error sending custom notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendCustomNotification,
  // Internal functions for other controllers to use
  createNotification,
  sendOrderNotification,
  sendProductNotification,
  sendEventNotification
};