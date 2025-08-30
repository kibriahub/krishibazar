const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!deliveryAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Delivery address and payment method are required' });
    }

    // Validate and process order items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Fetch product to validate and get current price
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

    // Calculate delivery fee and total
    const deliveryFee = 50; // Fixed delivery fee
    const total = subtotal + deliveryFee;

    // Create order
    const order = new Order({
      user: userId,
      items: processedItems,
      deliveryAddress,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      orderSummary: {
        subtotal,
        deliveryFee,
        total
      }
    });

    await order.save();

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } }
      );
    }

    // Populate order details for response
    await order.populate('user', 'name email');
    await order.populate('items.product', 'name images category');

    res.status(201).json({
      message: 'Order created successfully',
      order
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

    const order = await Order.findOne({ 
      $or: [{ _id: orderId }, { orderId: orderId }],
      user: userId 
    })
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

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    // Check if user is admin (you might want to implement proper role checking)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findOne({ 
      $or: [{ _id: orderId }, { orderId: orderId }] 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update status
    order.status = status;
    if (note) {
      order.notes = note;
    }

    await order.save();

    // Populate for response
    await order.populate('user', 'name email');
    await order.populate('items.product', 'name images');

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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // Calculate total revenue from delivered orders
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$orderSummary.total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue
      },
      recentOrders
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
};