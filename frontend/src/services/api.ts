import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This allows cookies to be sent with requests
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request Interceptor:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    
    console.log('Final request config:', {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  // Get all products with optional filters
  getProducts: async (filters = {}) => {
    try {
      const response = await api.get('/products', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get current user's products (for farmers/vendors)
  getMyProducts: async () => {
    try {
      const response = await api.get('/products/my-products');
      return response.data;
    } catch (error) {
      console.error('Error fetching my products:', error);
      throw error;
    }
  },

  // Get a single product by ID
  getProductById: async (id: string) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new product (for farmers/vendors)
  createProduct: async (productData: any) => {
    try {
      // For FormData, we need to set the correct headers
      const config = productData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      } : {};
      
      const response = await api.post('/products', productData, config);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update a product (for farmers/vendors)
  updateProduct: async (id: string, productData: any) => {
    try {
      const response = await api.put(`/products/${id}`, productData, {
        headers: {
          'Content-Type': productData instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a product (for farmers/vendors)
  deleteProduct: async (id: string) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
  },

  // Remove a specific image from a product
  removeProductImage: async (id: string, imageIndex: number) => {
    try {
      const response = await api.delete(`/products/${id}/images/${imageIndex}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing image from product with ID ${id}:`, error);
      throw error;
    }
  },

  // Add a review to a product
  addReview: async (id: string, reviewData: any) => {
    try {
      const response = await api.post(`/products/${id}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error(`Error adding review to product with ID ${id}:`, error);
      throw error;
    }
  },
};

// Auth API
export const authApi = {
  // Register a new user
  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Login a user
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Get current user's profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Forgot password - verify city hint
  forgotPassword: async (data: { email: string; city: string }) => {
    try {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    } catch (error) {
      console.error('Error in forgot password:', error);
      throw error;
    }
  },

  // Reset password with token
  resetPassword: async (resetToken: string, data: { password: string }) => {
    try {
      const response = await api.put(`/auth/reset-password/${resetToken}`, data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Logout the current user
  logout: async () => {
    try {
      const response = await api.get('/auth/logout');
      localStorage.removeItem('token');
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },
};

// Orders API
export const ordersApi = {
  // Create a new order
  createOrder: async (orderData: any) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get user's orders with pagination
  getUserOrders: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/orders', { 
        params: { page, limit } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (orderId: string) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order with ID ${orderId}:`, error);
      throw error;
    }
  },

  // Cancel an order
  cancelOrder: async (orderId: string, reason?: string) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order with ID ${orderId}:`, error);
      throw error;
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId: string, status: string, note?: string) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status, note });
      return response.data;
    } catch (error) {
      console.error(`Error updating order status for ID ${orderId}:`, error);
      throw error;
    }
  },

  // Get order stats
  getOrderStats: async () => {
    try {
      const response = await api.get('/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  },

  // Get COD orders pending approval
  getCODOrdersPendingApproval: async () => {
    try {
      const response = await api.get('/orders/cod/pending-approval');
      return response.data;
    } catch (error) {
      console.error('Error fetching COD orders pending approval:', error);
      throw error;
    }
  },

  // Approve COD payment by vendor
  approveVendorCODPayment: async (orderId: string, approvalData?: { notes?: string }) => {
    try {
      const response = await api.put(`/orders/${orderId}/cod/vendor-approve`, approvalData || {});
      return response.data;
    } catch (error) {
      console.error(`Error approving COD payment by vendor for order ${orderId}:`, error);
      throw error;
    }
  },

  // Approve COD payment by admin
  approveAdminCODPayment: async (orderId: string, approvalData?: { notes?: string }) => {
    try {
      const response = await api.put(`/orders/${orderId}/cod/admin-approve`, approvalData || {});
      return response.data;
    } catch (error) {
      console.error(`Error approving COD payment by admin for order ${orderId}:`, error);
      throw error;
    }
  },

  // Get seller/vendor orders
  getSellerOrders: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/orders/seller', { 
        params: { page, limit } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      throw error;
    }
  },

  // Admin CRUD operations
  getAllOrdersAdmin: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    paymentStatus?: string; 
  }) => {
    try {
      const response = await api.get('/orders/admin/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders (admin):', error);
      throw error;
    }
  },

  createOrderAdmin: async (orderData: {
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    deliveryAddress: any;
    paymentMethod: string;
    paymentDetails?: any;
    specialInstructions?: string;
    status?: string;
    paymentStatus?: string;
  }) => {
    try {
      const response = await api.post('/orders/admin/create', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order (admin):', error);
      throw error;
    }
  },

  updateOrderAdmin: async (orderId: string, updateData: {
    status?: string;
    paymentStatus?: string;
    deliveryAddress?: any;
    specialInstructions?: string;
    priority?: string;
    estimatedDelivery?: string;
    items?: any[];
    statusNote?: string;
  }) => {
    try {
      const response = await api.put(`/orders/admin/${orderId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId} (admin):`, error);
      throw error;
    }
  },

  deleteOrderAdmin: async (orderId: string) => {
    try {
      const response = await api.delete(`/orders/admin/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting order ${orderId} (admin):`, error);
      throw error;
    }
  },
};

// Admin Product Management API
export const adminProductsApi = {
  getAllProducts: (params?: { page?: number; limit?: number; category?: string; status?: string; search?: string }) =>
    api.get('/products/my-products', { params }),
  
  getProductById: (productId: string) =>
    api.get(`/products/${productId}`),
  
  createProduct: (productData: any) =>
    api.post('/products', productData),
  
  updateProduct: (productId: string, productData: any) =>
    api.put(`/products/${productId}`, productData),
  
  deleteProduct: (productId: string) =>
    api.delete(`/products/${productId}`),
  
  suspendProduct: (productId: string, reason?: string) => {
    // For now, we'll update the product status to 'inactive' as suspend functionality
    return api.put(`/products/${productId}`, { status: 'inactive', suspensionReason: reason });
  },
  
  activateProduct: (productId: string) => {
    // Update product status to 'active'
    return api.put(`/products/${productId}`, { status: 'active' });
  },
  
  getProductStats: () => {
    // This endpoint doesn't exist in backend, so we'll return mock data for now
    return Promise.resolve({ data: { totalProducts: 0, activeProducts: 0, inactiveProducts: 0 } });
  },
}

// Events API
export const eventsApi = {
  // Get all events with optional filters
  getEvents: async (params?: any) => {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get event by ID
  getEventById: async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Create a new event
  createEvent: async (eventData: any) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Update an event
  updateEvent: async (eventId: string, eventData: any) => {
    try {
      const response = await api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async (eventId: string) => {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Register for an event
  registerForEvent: async (eventId: string, registrationData?: { paymentMethod?: 'cod' | 'online' }) => {
    try {
      const response = await api.post(`/events/${eventId}/register`, registrationData || {});
      return response.data;
    } catch (error) {
      console.error(`Error registering for event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Cancel event registration
  cancelRegistration: async (eventId: string) => {
    try {
      const response = await api.put(`/events/${eventId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error cancelling registration for event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get user's events
  getUserEvents: async (params?: any) => {
    try {
      const response = await api.get('/events/my-events', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user events:', error);
      throw error;
    }
  },

  // Get event statistics
  getEventStats: async () => {
    try {
      const response = await api.get('/events/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching event statistics:', error);
      throw error;
    }
  },
};

// Admin Events API
export const adminEventsApi = {
  // Get events pending approval
  getEventsPendingApproval: async (params?: any) => {
    try {
      const response = await api.get('/admin/events/pending-approval', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching events pending approval:', error);
      throw error;
    }
  },

  // Approve an event
  approveEvent: async (eventId: string, approvalData?: { notes?: string }) => {
    try {
      const response = await api.put(`/admin/events/${eventId}/approve`, approvalData || {});
      return response.data;
    } catch (error) {
      console.error(`Error approving event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Reject an event
  rejectEvent: async (eventId: string, rejectionData: { reason: string; notes?: string }) => {
    try {
      const response = await api.put(`/admin/events/${eventId}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      console.error(`Error rejecting event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get all events for admin management
  getAllEvents: async (params?: any) => {
    try {
      const response = await api.get('/admin/events', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all events for admin:', error);
      throw error;
    }
  },

  // Suspend an event
  suspendEvent: async (eventId: string, suspensionData: { reason: string; notes?: string }) => {
    try {
      const response = await api.put(`/admin/events/${eventId}/suspend`, suspensionData);
      return response.data;
    } catch (error) {
      console.error(`Error suspending event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Reactivate a suspended event
  reactivateEvent: async (eventId: string) => {
    try {
      const response = await api.put(`/admin/events/${eventId}/reactivate`);
      return response.data;
    } catch (error) {
      console.error(`Error reactivating event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get event approval statistics
  getEventApprovalStats: async () => {
    try {
      const response = await api.get('/admin/events/approval-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching event approval statistics:', error);
      throw error;
    }
  },
};

// Reviews API
export const reviewsApi = {
  // Get all reviews with optional filters
  getReviews: async (params?: {
    reviewType?: string;
    targetId?: string;
    rating?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/reviews', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  // Get reviews for a specific target
  getTargetReviews: async (reviewType: string, targetId: string, params?: {
    rating?: number;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get(`/reviews/${reviewType}/${targetId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching reviews for ${reviewType} ${targetId}:`, error);
      throw error;
    }
  },

  // Get a single review by ID
  getReview: async (id: string) => {
    try {
      const response = await api.get(`/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching review with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new review
  createReview: async (reviewData: any) => {
    console.log('API: createReview called with data:', reviewData);
    console.log('API: Base URL:', API_URL);
    console.log('API: Full API instance config:', api.defaults);
    
    // Check if we have an auth token
    const token = localStorage.getItem('token');
    console.log('API: Auth token exists:', !!token);
    console.log('API: Auth token preview:', token ? token.substring(0, 20) + '...' : 'none');
    
    try {
      // Test the debug endpoint first
      console.log('API: Testing debug endpoint...');
      const testResponse = await api.post('/reviews/test', { test: 'data' });
      console.log('API: Test endpoint response:', testResponse.data);
    } catch (testError: any) {
      console.log('API: Test endpoint failed:', testError);
      console.log('API: Test error response:', testError.response);
      console.log('API: Test error message:', testError.message);
      console.log('API: Test error code:', testError.code);
    }
    
    try {
      console.log('API: Making actual createReview request...');
      const response = await api.post('/reviews', reviewData);
      console.log('API: createReview success:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('API: createReview failed - Full error:', error);
      console.log('API: createReview error response:', error.response);
      console.log('API: createReview error message:', error.message);
      console.log('API: createReview error code:', error.code);
      console.log('API: createReview error status:', error.response?.status);
      console.log('API: createReview error data:', error.response?.data);
      throw error;
    }
  },

  // Update a review
  updateReview: async (id: string, reviewData: any) => {
    try {
      const response = await api.put(`/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      console.error(`Error updating review with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (id: string) => {
    try {
      const response = await api.delete(`/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting review with ID ${id}:`, error);
      throw error;
    }
  },

  // Vote on a review
  voteOnReview: async (id: string, voteData: { voteType: 'helpful' | 'not_helpful' }) => {
    try {
      const response = await api.post(`/reviews/${id}/vote`, voteData);
      return response.data;
    } catch (error) {
      console.error(`Error voting on review with ID ${id}:`, error);
      throw error;
    }
  },

  // Flag a review
  flagReview: async (id: string, flagData: { reason: string; description?: string }) => {
    try {
      const response = await api.post(`/reviews/${id}/flag`, flagData);
      return response.data;
    } catch (error) {
      console.error(`Error flagging review with ID ${id}:`, error);
      throw error;
    }
  },

  // Add response to a review
  addResponse: async (id: string, responseData: { response: string }) => {
    try {
      const response = await api.post(`/reviews/${id}/response`, responseData);
      return response.data;
    } catch (error) {
      console.error(`Error adding response to review with ID ${id}:`, error);
      throw error;
    }
  },

  // Get user's reviews
  getUserReviews: async (userId?: string) => {
    try {
      const endpoint = userId ? `/reviews/user/${userId}` : '/reviews/user/me';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  },

  // Moderate a review (admin only)
  moderateReview: async (id: string, moderationData: { 
    status: 'approved' | 'rejected' | 'pending';
    moderationNotes?: string;
  }) => {
    try {
      const response = await api.put(`/reviews/${id}/moderate`, moderationData);
      return response.data;
    } catch (error) {
      console.error(`Error moderating review with ID ${id}:`, error);
      throw error;
    }
  },

  // Get review statistics
  getReviewStats: async () => {
    try {
      const response = await api.get('/reviews/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching review statistics:', error);
      throw error;
    }
  },

  // Get reviewable products for current user
  getReviewableProducts: async () => {
    try {
      const response = await api.get('/reviews/reviewable-products');
      return response.data;
    } catch (error) {
      console.error('Error fetching reviewable products:', error);
      throw error;
    }
  },
};

// Dashboard API
export const dashboardApi = {
  // Get vendor dashboard data
  getVendorDashboard: async () => {
    try {
      const response = await api.get('/dashboard/vendor');
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor dashboard:', error);
      throw error;
    }
  },

  // Get vendor analytics
  getVendorAnalytics: async (period: string = 'month') => {
    try {
      const response = await api.get(`/dashboard/vendor/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor analytics:', error);
      throw error;
    }
  },

  getConsumerDashboard: async () => {
    try {
      const response = await api.get('/dashboard/consumer');
      return response.data;
    } catch (error) {
      console.error('Error fetching consumer dashboard:', error);
      throw error;
    }
  },
};

// Notifications API
export const notificationsApi = {
  // Get user notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  },

  // Send custom notification (Admin only)
  sendCustomNotification: async (notificationData: {
    recipients: string[];
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    metadata?: any;
  }) => {
    try {
      const response = await api.post('/notifications/send', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending custom notification:', error);
      throw error;
    }
  },
};



export default api;