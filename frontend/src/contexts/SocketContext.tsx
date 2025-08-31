import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: any;
  createdAt: string;
  read: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: number;
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (notificationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        autoConnect: true
      });

      // Fetch initial unread count
      const fetchUnreadCount = async () => {
        try {
          const response = await notificationsApi.getUnreadCount();
          setUnreadCount(response.count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      fetchUnreadCount();

      // Set up polling for unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Notification event handlers
      newSocket.on('new_notification', (notification: Notification) => {
        console.log('New notification received:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        
        // Update unread count
        if (!notification.read) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Show toast notification
        const toastOptions = {
          position: 'top-right' as const,
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        };

        switch (notification.priority) {
          case 'high':
            toast.error(notification.message, toastOptions);
            break;
          case 'medium':
            toast.warning(notification.message, toastOptions);
            break;
          default:
            toast.info(notification.message, toastOptions);
        }
      });

      newSocket.on('notification_updated', (data: { notificationId: string; read: boolean; readAt: string }) => {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === data.notificationId 
              ? { ...notif, read: data.read }
              : notif
          )
        );
        
        if (data.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      });

      // Online users count (if implemented on server)
      newSocket.on('online_users_count', (count: number) => {
        setOnlineUsers(count);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        clearInterval(interval);
        newSocket.close();
      };
    } else {
      // Disconnect if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [user]);

  const markNotificationAsRead = (notificationId: string) => {
    if (socket) {
      socket.emit('mark_notification_read', { notificationId });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    unreadCount,
    markNotificationAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};