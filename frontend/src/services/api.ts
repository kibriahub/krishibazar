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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
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
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update a product (for farmers/vendors)
  updateProduct: async (id: string, productData: any) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
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

  // Get order statistics (admin only)
  getOrderStats: async () => {
    try {
      const response = await api.get('/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }
  },
};

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
  registerForEvent: async (eventId: string) => {
    try {
      const response = await api.post(`/events/${eventId}/register`);
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
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
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
};

export default api;