const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'order_confirmed',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'product_back_in_stock',
      'new_product_arrival',
      'event_announced',
      'event_reminder',
      'event_completed',
      'special_offer',
      'review_received',
      'payment_received',
      'low_inventory_warning',
      'general'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    actionUrl: String, // URL to redirect when notification is clicked
    imageUrl: String,  // Optional image for the notification
    expiresAt: Date    // For time-sensitive notifications
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  deliveryChannels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  sentAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.metadata.expiresAt && this.metadata.expiresAt < new Date();
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  return notification;
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Pre-save middleware to set sentAt timestamp
notificationSchema.pre('save', function(next) {
  if (this.isNew && this.deliveryStatus === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);