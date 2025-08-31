const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const socketService = require('./services/socketService');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/krishibazar';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('KrishiBazar API is running');
});

// Global request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Route files
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const eventRoutes = require('./routes/events');
const reviewRoutes = require('./routes/reviews');
const inventoryRoutes = require('./routes/inventory');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const schedulerRoutes = require('./routes/scheduler');
const { handleUploadError } = require('./middleware/upload');

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/scheduler', schedulerRoutes);

// Global error handler for debugging
app.use((err, req, res, next) => {
  console.error('\n=== GLOBAL ERROR HANDLER ===');
  console.error('Error occurred for:', req.method, req.originalUrl);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('=== END GLOBAL ERROR ===\n');
  
  res.status(500).json({
    success: false,
    error: 'Server Error',
    message: err.message
  });
});

// Error handling middleware
app.use(handleUploadError);

// Start server
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
socketService.init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});