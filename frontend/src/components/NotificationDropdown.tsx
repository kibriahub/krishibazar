import React, { useState, useEffect, useRef } from 'react';
import { notificationsApi } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import './NotificationDropdown.css';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: string;
  metadata?: {
    orderId?: string;
    productId?: string;
    eventId?: string;
    actionUrl?: string;
    imageUrl?: string;
  };
}

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use Socket.IO context for real-time notifications
  const { notifications: realtimeNotifications, unreadCount, markNotificationAsRead, isConnected } = useSocket();

  // Fetch notifications from API (for initial load and pagination)
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications({
        page: pageNum,
        limit: 10
      });
      
      if (response.success) {
        if (reset) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.page < response.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read (using Socket.IO for real-time update)
  const markAsRead = async (notificationId: string) => {
    try {
      // Use Socket.IO for real-time update
      markNotificationAsRead(notificationId);
      
      // Also call API to ensure persistence
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      // Real-time unread count will be updated via Socket.IO
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      // Unread count will be updated via Socket.IO
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to action URL if available
    if (notification.metadata?.actionUrl) {
      window.location.href = notification.metadata.actionUrl;
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, false);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(1, true);
      setPage(1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Merge real-time notifications with fetched notifications
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      // Merge real-time notifications with existing ones, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifications = realtimeNotifications.filter(n => !existingIds.has(n.id));
        return [...newNotifications, ...prev];
      });
    }
  }, [realtimeNotifications]);

  // Fetch initial notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Format notification time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
        return '📦';
      case 'order_cancelled':
        return '❌';
      case 'product_back_in_stock':
      case 'new_product_arrival':
        return '🛒';
      case 'event_announced':
      case 'event_reminder':
      case 'event_completed':
        return '📅';
      case 'payment_received':
        return '💰';
      default:
        return '🔔';
    }
  };

  return (
    <div className={`notification-dropdown ${className}`} ref={dropdownRef}>
      <button 
        className="notification-bell"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="connection-indicator offline" title="Offline - Real-time notifications disabled"></span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''} priority-${notification.priority}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.createdAt)}</div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete notification"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}

            {hasMore && (
              <button 
                className="load-more-btn"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;