const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  // Initialize Socket.IO server
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    // Handle socket connections
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Join user to their personal room for targeted notifications
      socket.join(`user_${socket.userId}`);
      
      // Join role-based rooms
      if (socket.user.role) {
        socket.join(`role_${socket.user.role}`);
      }

      // Handle notification acknowledgment
      socket.on('notification_received', (data) => {
        console.log(`Notification ${data.notificationId} acknowledged by user ${socket.userId}`);
      });

      // Handle marking notification as read
      socket.on('mark_notification_read', async (data) => {
        try {
          const { notificationId } = data;
          const Notification = require('../models/Notification');
          
          await Notification.findByIdAndUpdate(notificationId, {
            read: true,
            readAt: new Date()
          });

          // Broadcast updated notification status to user
          socket.emit('notification_updated', {
            notificationId,
            read: true,
            readAt: new Date()
          });
        } catch (error) {
          console.error('Error marking notification as read:', error);
          socket.emit('error', { message: 'Failed to mark notification as read' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected`);
        this.connectedUsers.delete(socket.userId);
      });
    });

    console.log('Socket.IO server initialized');
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
      console.log(`Sent ${event} to user ${userId}:`, data);
    }
  }

  // Send notification to all users with specific role
  sendToRole(role, event, data) {
    if (this.io) {
      this.io.to(`role_${role}`).emit(event, data);
      console.log(`Sent ${event} to role ${role}:`, data);
    }
  }

  // Send notification to all connected users
  sendToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`Sent ${event} to all users:`, data);
    }
  }

  // Send real-time notification
  sendNotification(notification) {
    if (!this.io) return;

    const notificationData = {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      read: notification.read
    };

    // Send to specific recipient
    if (notification.recipient) {
      this.sendToUser(notification.recipient.toString(), 'new_notification', notificationData);
    }

    // Send to role-based recipients if specified in metadata
    if (notification.metadata && notification.metadata.targetRole) {
      this.sendToRole(notification.metadata.targetRole, 'new_notification', notificationData);
    }
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

// Export singleton instance
module.exports = new SocketService();