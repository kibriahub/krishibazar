const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { sendOrderNotification } = require('./notifications');

// Create a new order
const createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod,
      paymentDetails,
      specialInstructions,
      reservationId
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!deliveryAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Delivery address and payment method are required' });
    }

    // Validate and process order items with real-time stock validation
    const processedItems = [];
    const stockValidation = [];
    let subtotal = 0;

    for (const item of items) {
      // Fetch product to validate and get current price
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      }

        // Check real-time stock availability (considering reservations)
        const availableStock = product.getAvailableStock ? product.getAvailableStock() : product.quantity;
        if (availableStock < item.quantity) {
          stockValidation.push({
            productId: item.productId,
            productName: product.name,
            requested: item.quantity,
            available: availableStock,
            status: 'insufficient'
          });
        } else {
          stockValidation.push({
            productId: item.productId,
            productName: product.name,
            requested: item.quantity,
            available: availableStock,
            status: 'available'
          });
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        processedItems.push({
          product: product._id,
          productName: product.name,
          quantity: item.quantity,
          unit: product.unit,
          price: product.price,
          totalPrice: itemTotal,
          seller: product.seller || 'Unknown',
          sellerType: product.sellerType
        });
      }

    // Check if any items have insufficient stock
    const insufficientItems = stockValidation.filter(item => item.status === 'insufficient');
    if (insufficientItems.length > 0) {
      return res.status(400).json({ 
        message: 'Insufficient stock for some items',
        insufficientItems,
        stockValidation
      });
    }

      // Calculate delivery fee and total
      const deliveryFee = subtotal > 1000 ? 0 : 50; // Free delivery over 1000
      const tax = subtotal * 0.1; // 10% tax
      const discount = 0; // Can be calculated based on coupons
      const total = subtotal + deliveryFee + tax - discount;

      // Generate unique order ID
      const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Estimate delivery date (7 days from now)
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

      // Set payment status based on payment method
      const paymentStatus = paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending';
      const orderStatus = paymentMethod === 'cash_on_delivery' ? 'confirmed' : 'pending';
      
      // Create order
      const order = new Order({
        orderId,
        user: userId,
        items: processedItems,
        deliveryAddress,
        paymentMethod,
        paymentDetails: paymentDetails || {},
        specialInstructions,
        orderSummary: {
          subtotal,
          deliveryFee,
          tax,
          discount,
          total
        },
        status: orderStatus,
        paymentStatus,
        priority: 'normal',
        estimatedDelivery,
        statusHistory: [{
          status: orderStatus,
          timestamp: new Date(),
          note: paymentMethod === 'cash_on_delivery' ? 'COD order confirmed, awaiting delivery' : 'Order created successfully',
          updatedBy: userId
        }]
      });
      
    await order.save();

    // Update product quantities (reduce stock)
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } }
      );
    }

    // If there was a reservation, confirm it
    if (reservationId) {
      // Remove the reservation since order is confirmed
      await Product.updateMany(
        { 'reservations.reservationId': reservationId },
        { $pull: { reservations: { reservationId } } }
      );
    }

    // Populate order details for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images category');

    // Send order confirmation email
    try {
      const orderData = {
        orderId: populatedOrder.orderId,
        customerName: populatedOrder.user.name,
        items: populatedOrder.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: populatedOrder.orderSummary.total,
        paymentMethod: populatedOrder.paymentMethod,
        status: populatedOrder.status,
        createdAt: populatedOrder.createdAt,
        deliveryAddress: populatedOrder.deliveryAddress
      };
      
      await sendOrderConfirmationEmail(populatedOrder.user.email, orderData);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Send order confirmation notification
    try {
      await sendOrderNotification(populatedOrder._id, 'order_confirmed');
    } catch (notificationError) {
      console.error('Failed to send order confirmation notification:', notificationError);
      // Don't fail the order creation if notification fails
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder,
      stockValidation
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name images category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Build query conditions based on orderId format
    let query = { user: userId };
    
    // Check if orderId is a valid ObjectId format
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24) {
      query.$or = [{ _id: orderId }, { orderId: orderId }];
    } else {
      // If not a valid ObjectId, only search by orderId field
      query.orderId = orderId;
    }

    const order = await Order.findOne(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images category description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status (admin/seller only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, trackingNumber, carrier, trackingUrl } = req.body;

    // Check if user has permission to update order status
    if (!['admin', 'farmer', 'vendor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin or seller privileges required.' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findOne({ 
      $or: [{ _id: orderId }, { orderId: orderId }] 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if seller can only update their own orders
    if (['farmer', 'vendor'].includes(req.user.role)) {
      const hasSellerItems = order.items.some(item => item.seller === req.user.id);
      if (!hasSellerItems) {
        return res.status(403).json({ message: 'You can only update orders containing your products' });
      }
    }

    // Validate status transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['packed', 'cancelled'],
      'packed': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'returned'],
      'delivered': ['returned'],
      'cancelled': [],
      'returned': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    // Update status and tracking info
    order.status = status;
    if (note) {
      order.notes = note;
    }

    // Add tracking information if provided
    if (trackingNumber || carrier || trackingUrl) {
      order.deliveryTracking = {
        trackingNumber: trackingNumber || order.deliveryTracking?.trackingNumber,
        carrier: carrier || order.deliveryTracking?.carrier,
        trackingUrl: trackingUrl || order.deliveryTracking?.trackingUrl
      };
    }

    // Update status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`,
      updatedBy: req.user.id
    });

    // Set actual delivery date if delivered
    if (status === 'delivered' && !order.actualDelivery) {
      order.actualDelivery = new Date();
    }

    await order.save();

    // Populate for response
    await order.populate('user', 'name email phone');
    await order.populate('items.product', 'name images');
    await order.populate('statusHistory.updatedBy', 'name role');

    // Send notification to customer about status update
    try {
      const notificationTypes = {
        'confirmed': 'order_confirmed',
        'out_for_delivery': 'order_shipped',
        'delivered': 'order_delivered',
        'cancelled': 'order_cancelled'
      };
      
      const notificationType = notificationTypes[status];
      if (notificationType) {
        await sendOrderNotification(order._id, notificationType);
      }
    } catch (notificationError) {
      console.error('Failed to send order notification:', notificationError);
      // Don't fail the order update if notification fails
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel order (user can cancel if status is pending or confirmed)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const order = await Order.findOne({ 
      $or: [{ _id: orderId }, { orderId: orderId }],
      user: userId 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled. Current status: ' + order.status 
      });
    }

    // Update order status
    order.status = 'cancelled';
    if (reason) {
      order.notes = `Cancelled by user: ${reason}`;
    }

    await order.save();

    // Send cancellation notification
    try {
      await sendOrderNotification(order._id, 'order_cancelled', reason ? `Reason: ${reason}` : null);
    } catch (notificationError) {
      console.error('Failed to send order cancellation notification:', notificationError);
      // Don't fail the cancellation if notification fails
    }

    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } }
      );
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order statistics (admin only)
const getOrderStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$orderSummary.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$orderSummary.total' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get orders by priority
    const priorityStats = await Order.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get delivery performance
    const deliveryStats = await Order.aggregate([
      {
        $match: { 
          status: 'delivered',
          estimatedDelivery: { $exists: true },
          actualDelivery: { $exists: true }
        }
      },
      {
        $project: {
          onTime: {
            $cond: {
              if: { $lte: ['$actualDelivery', '$estimatedDelivery'] },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDelivered: { $sum: 1 },
          onTimeDeliveries: { $sum: '$onTime' }
        }
      }
    ]);

    res.json({
      stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
      priorityStats,
      deliveryPerformance: deliveryStats[0] || { totalDelivered: 0, onTimeDeliveries: 0 }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk update order status
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status, note } = req.body;

    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs are required' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const updateResult = await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { status },
        $push: {
          statusHistory: {
            status,
            timestamp: new Date(),
            note: note || `Bulk status update to ${status}`,
            updatedBy: req.user.id
          }
        }
      }
    );

    // Send notifications for bulk status updates
    try {
      const notificationTypes = {
        'confirmed': 'order_confirmed',
        'out_for_delivery': 'order_shipped',
        'delivered': 'order_delivered',
        'cancelled': 'order_cancelled'
      };
      
      const notificationType = notificationTypes[status];
      if (notificationType) {
        // Send notifications for each updated order
        for (const orderId of orderIds) {
          try {
            await sendOrderNotification(orderId, notificationType);
          } catch (notificationError) {
            console.error(`Failed to send notification for order ${orderId}:`, notificationError);
          }
        }
      }
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
    }

    res.json({
      message: `Successfully updated ${updateResult.modifiedCount} orders`,
      modifiedCount: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Bulk update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order priority
const updateOrderPriority = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { priority } = req.body;

    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority level' });
    }

    const order = await Order.findOneAndUpdate(
      { $or: [{ _id: orderId }, { orderId: orderId }] },
      { priority },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order priority updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order priority error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get orders by seller
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query to find orders containing seller's products
    let matchQuery = {
      'items.seller': sellerId
    };

    if (status) {
      matchQuery.status = status;
    }

    const orders = await Order.find(matchQuery)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get detailed order tracking information
const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find order by orderId or _id
    let order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }]
    })
    .populate('user', 'name email phone')
    .populate('items.product', 'name images category seller')
    .populate('statusHistory.updatedBy', 'name role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isOwner = order.user._id.toString() === userId;
    const isAdmin = userRole === 'admin';
    const isSeller = order.items.some(item => item.seller && item.seller.toString() === userId);

    if (!isOwner && !isAdmin && !isSeller) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate delivery progress
    const statusOrder = ['pending', 'confirmed', 'preparing', 'packed', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    const progressPercentage = order.status === 'delivered' ? 100 : 
                              order.status === 'cancelled' ? 0 : 
                              Math.max(0, (currentStatusIndex + 1) / statusOrder.length * 100);

    // Estimate delivery if not set
    let estimatedDelivery = order.estimatedDelivery;
    if (!estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled') {
      estimatedDelivery = new Date(order.createdAt);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
    }

    // Calculate delivery status
    let deliveryStatus = 'on_time';
    if (order.status === 'delivered' && order.actualDelivery && estimatedDelivery) {
      deliveryStatus = order.actualDelivery <= estimatedDelivery ? 'delivered_on_time' : 'delivered_late';
    } else if (estimatedDelivery && new Date() > estimatedDelivery && order.status !== 'delivered') {
      deliveryStatus = 'delayed';
    }

    const trackingInfo = {
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        priority: order.priority,
        createdAt: order.createdAt,
        estimatedDelivery,
        actualDelivery: order.actualDelivery,
        deliveryStatus,
        progressPercentage,
        specialInstructions: order.specialInstructions,
        cancellationReason: order.cancellationReason
      },
      customer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone
      },
      items: order.items.map(item => ({
        product: {
          id: item.product._id,
          name: item.product.name,
          images: item.product.images,
          category: item.product.category
        },
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        seller: item.seller
      })),
      deliveryAddress: order.deliveryAddress,
      orderSummary: order.orderSummary,
      statusHistory: order.statusHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      deliveryTracking: order.deliveryTracking || {}
    };

    res.json({
      message: 'Order tracking retrieved successfully',
      tracking: trackingInfo
    });

  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order history for a user
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build query
    let query = { user: userId };
    
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name images category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('orderId status paymentStatus createdAt estimatedDelivery actualDelivery orderSummary items priority');

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Calculate summary statistics
    const orderStats = await Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$orderSummary.total' }
        }
      }
    ]);

    const totalSpent = await Order.aggregate([
      { 
        $match: { 
          user: userId, 
          status: { $in: ['delivered', 'confirmed', 'preparing', 'packed', 'out_for_delivery'] }
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$orderSummary.total' }
        }
      }
    ]);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        orderStats,
        totalSpent: totalSpent[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update delivery tracking information
const updateDeliveryTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier, currentLocation, estimatedDelivery, notes } = req.body;

    // Check if user has permission (admin or seller)
    if (!['admin', 'farmer', 'vendor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update delivery tracking
    const trackingUpdate = {
      trackingNumber: trackingNumber || order.deliveryTracking?.trackingNumber,
      carrier: carrier || order.deliveryTracking?.carrier,
      currentLocation: currentLocation || order.deliveryTracking?.currentLocation,
      lastUpdated: new Date(),
      notes: notes || order.deliveryTracking?.notes
    };

    if (estimatedDelivery) {
      order.estimatedDelivery = new Date(estimatedDelivery);
    }

    order.deliveryTracking = { ...order.deliveryTracking, ...trackingUpdate };

    // Add to status history
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Delivery tracking updated: ${notes || 'Tracking information updated'}`,
      updatedBy: req.user.id
    });

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    res.json({
      message: 'Delivery tracking updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update delivery tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get delivery timeline for an order
const getDeliveryTimeline = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }]
    })
    .populate('statusHistory.updatedBy', 'name role')
    .populate('user', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isOwner = order.user._id.toString() === userId;
    const isAdmin = userRole === 'admin';
    const isSeller = order.items.some(item => item.seller && item.seller.toString() === userId);

    if (!isOwner && !isAdmin && !isSeller) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create comprehensive timeline
    const timeline = order.statusHistory.map(entry => ({
      status: entry.status,
      timestamp: entry.timestamp,
      note: entry.note,
      updatedBy: entry.updatedBy ? {
        name: entry.updatedBy.name,
        role: entry.updatedBy.role
      } : null,
      isCompleted: true
    }));

    // Add future expected statuses if order is not completed
    if (!['delivered', 'cancelled', 'returned'].includes(order.status)) {
      const futureStatuses = {
        'pending': ['confirmed', 'preparing', 'packed', 'out_for_delivery', 'delivered'],
        'confirmed': ['preparing', 'packed', 'out_for_delivery', 'delivered'],
        'preparing': ['packed', 'out_for_delivery', 'delivered'],
        'packed': ['out_for_delivery', 'delivered'],
        'out_for_delivery': ['delivered']
      };

      const expectedStatuses = futureStatuses[order.status] || [];
      expectedStatuses.forEach((status, index) => {
        const expectedDate = new Date(order.createdAt);
        expectedDate.setDate(expectedDate.getDate() + (index + 2) * 1); // Rough estimation
        
        timeline.push({
          status,
          timestamp: expectedDate,
          note: `Expected ${status} status`,
          updatedBy: null,
          isCompleted: false,
          isExpected: true
        });
      });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      orderId: order.orderId,
      currentStatus: order.status,
      timeline,
      deliveryTracking: order.deliveryTracking || {},
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery
    });

  } catch (error) {
    console.error('Get delivery timeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// COD Payment Approval by Vendor
const approveVendorCODPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the vendor for this order
    const isVendor = order.items.some(item => item.seller === userId);
    if (!isVendor) {
      return res.status(403).json({ message: 'Not authorized to approve this order' });
    }

    // Check if order is COD and delivered
    if (order.paymentMethod !== 'cash_on_delivery') {
      return res.status(400).json({ message: 'This is not a Cash on Delivery order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Order must be delivered before payment approval' });
    }

    // Initialize codApproval if it doesn't exist
    if (!order.paymentDetails.codApproval) {
      order.paymentDetails.codApproval = {};
    }

    // Update vendor approval
    order.paymentDetails.codApproval.vendorApproved = true;
    order.paymentDetails.codApproval.vendorApprovedBy = userId;
    order.paymentDetails.codApproval.vendorApprovedAt = new Date();
    
    // Add status history entry
    order.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      note: 'Payment approved by vendor, pending admin approval',
      updatedBy: userId
    });

    await order.save();

    res.json({
      message: 'COD payment approved by vendor successfully',
      order
    });

  } catch (error) {
    console.error('Approve vendor COD payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// COD Payment Approval by Admin
const approveAdminCODPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is COD and vendor has approved
    if (order.paymentMethod !== 'cash_on_delivery') {
      return res.status(400).json({ message: 'This is not a Cash on Delivery order' });
    }

    if (!order.paymentDetails.codApproval || !order.paymentDetails.codApproval.vendorApproved) {
      return res.status(400).json({ message: 'Vendor approval required first' });
    }

    // Update admin approval and payment status
    order.paymentDetails.codApproval.adminApproved = true;
    order.paymentDetails.codApproval.adminApprovedBy = userId;
    order.paymentDetails.codApproval.adminApprovedAt = new Date();
    order.paymentStatus = 'completed';
    
    // Add status history entry
    order.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      note: 'COD payment fully approved and completed',
      updatedBy: userId
    });

    await order.save();

    res.json({
      message: 'COD payment approved by admin successfully',
      order
    });

  } catch (error) {
    console.error('Approve admin COD payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get COD Orders Pending Approval
const getCODOrdersPendingApproval = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    let query = {
      paymentMethod: 'cash_on_delivery',
      status: 'delivered'
    };

    if (user.role === 'admin') {
      // Admin sees orders pending admin approval (vendor already approved)
      query['paymentDetails.codApproval.vendorApproved'] = true;
      query['paymentDetails.codApproval.adminApproved'] = { $ne: true };
    } else {
      // Vendor sees their own orders pending vendor approval
      query['items.seller'] = userId;
      query['paymentDetails.codApproval.vendorApproved'] = { $ne: true };
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json({
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Get COD orders pending approval error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin CRUD operations
const getAllOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const paymentStatus = req.query.paymentStatus || '';

    // Build filter object
    let filter = {};
    if (search) {
      // Only search by orderId field, not populated fields
      filter.orderId = { $regex: search, $options: 'i' };
    }
    if (status) filter.status = status;
    if (paymentStatus) filter['paymentDetails.paymentStatus'] = paymentStatus;

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images category price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all orders admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateOrderAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;
    const adminId = req.user.id;

    // Build query conditions based on orderId format
    const mongoose = require('mongoose');
    let query;
    if (mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }] };
    } else {
      query = { orderId: orderId };
    }

    // Find the order
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'status', 'paymentStatus', 'deliveryAddress', 'specialInstructions',
      'priority', 'estimatedDelivery', 'items'
    ];

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        order[key] = updateData[key];
      }
    });

    // Add to status history if status changed
    if (updateData.status && updateData.status !== order.status) {
      order.statusHistory.push({
        status: updateData.status,
        timestamp: new Date(),
        note: updateData.statusNote || `Status updated by admin`,
        updatedBy: adminId
      });
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images category price');

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteOrderAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;

    // Build query conditions based on orderId format
    const mongoose = require('mongoose');
    let query;
    if (mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }] };
    } else {
      query = { orderId: orderId };
    }

    // Find the order
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be deleted (only pending or cancelled orders)
    if (!['pending', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Only pending or cancelled orders can be deleted' 
      });
    }

    // Restore product quantities if order was confirmed
    if (order.status === 'confirmed' || order.status === 'processing') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } }
        );
      }
    }

    await Order.findOneAndDelete(query);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createOrderAdmin = async (req, res) => {
  try {
    const {
      userId,
      items,
      deliveryAddress,
      paymentMethod,
      paymentDetails,
      specialInstructions,
      status = 'pending',
      paymentStatus = 'pending'
    } = req.body;
    const adminId = req.user.id;

    // Validate required fields
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'User ID and order items are required' });
    }

    if (!deliveryAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Delivery address and payment method are required' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Process order items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      }

      // Check stock availability
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit: product.unit,
        price: product.price,
        totalPrice: itemTotal,
        seller: product.seller || 'Unknown',
        sellerType: product.sellerType
      });
    }

    // Calculate totals
    const deliveryFee = subtotal > 1000 ? 0 : 50;
    const tax = subtotal * 0.1;
    const discount = 0;
    const total = subtotal + deliveryFee + tax - discount;

    // Generate unique order ID
    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Estimate delivery date
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // Create order
    const order = new Order({
      orderId,
      user: userId,
      items: processedItems,
      deliveryAddress,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      specialInstructions,
      orderSummary: {
        subtotal,
        deliveryFee,
        tax,
        discount,
        total
      },
      status,
      paymentStatus,
      priority: 'normal',
      estimatedDelivery,
      statusHistory: [{
        status,
        timestamp: new Date(),
        note: 'Order created by admin',
        updatedBy: adminId
      }]
    });

    await order.save();

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } }
      );
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images category');

    res.status(201).json({
      message: 'Order created successfully by admin',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders: getUserOrders,
  getOrder: getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  bulkUpdateOrderStatus,
  updateOrderPriority,
  getSellerOrders,
  getOrderTracking,
  getOrderHistory,
  updateDeliveryTracking,
  getDeliveryTimeline,
  approveVendorCODPayment,
  approveAdminCODPayment,
  getCODOrdersPendingApproval,
  // Admin CRUD operations
  getAllOrdersAdmin,
  updateOrderAdmin,
  deleteOrderAdmin,
  createOrderAdmin
};