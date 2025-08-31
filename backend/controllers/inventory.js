const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendProductNotification } = require('./notifications');

// Check stock availability for multiple products
const checkStockAvailability = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const stockCheck = [];
    let allAvailable = true;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        stockCheck.push({
          productId: item.productId,
          available: false,
          reason: 'Product not found',
          requestedQuantity: item.quantity,
          availableQuantity: 0
        });
        allAvailable = false;
        continue;
      }

      const isAvailable = product.quantity >= item.quantity;
      
      stockCheck.push({
        productId: item.productId,
        productName: product.name,
        available: isAvailable,
        requestedQuantity: item.quantity,
        availableQuantity: product.quantity,
        reason: !isAvailable ? 'Insufficient stock' : null
      });

      if (!isAvailable) {
        allAvailable = false;
      }
    }

    res.json({
      allAvailable,
      stockCheck
    });

  } catch (error) {
    console.error('Check stock availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reserve stock for order (temporary hold)
const reserveStock = async (req, res) => {
  try {
    const { items, reservationId } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const reservationResults = [];
    let allReserved = true;

    // Start a transaction for atomic operations
    const session = await Product.startSession();
    session.startTransaction();

    try {
      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        
        if (!product) {
          reservationResults.push({
            productId: item.productId,
            reserved: false,
            reason: 'Product not found'
          });
          allReserved = false;
          continue;
        }

        if (product.quantity < item.quantity) {
          reservationResults.push({
            productId: item.productId,
            reserved: false,
            reason: 'Insufficient stock',
            availableQuantity: product.quantity,
            requestedQuantity: item.quantity
          });
          allReserved = false;
          continue;
        }

        // Reserve stock by reducing available quantity
        await Product.findByIdAndUpdate(
          item.productId,
          { 
            $inc: { quantity: -item.quantity },
            $push: {
              reservations: {
                reservationId: reservationId || req.user.id + '_' + Date.now(),
                quantity: item.quantity,
                userId: req.user.id,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
              }
            }
          },
          { session }
        );

        reservationResults.push({
          productId: item.productId,
          reserved: true,
          reservedQuantity: item.quantity
        });
      }

      if (allReserved) {
        await session.commitTransaction();
        res.json({
          success: true,
          message: 'Stock reserved successfully',
          reservationResults,
          reservationId: reservationId || req.user.id + '_' + Date.now()
        });
      } else {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: 'Could not reserve all items',
          reservationResults
        });
      }

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Reserve stock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Confirm stock reservation (convert to actual sale)
const confirmStockReservation = async (req, res) => {
  try {
    const { reservationId, orderId } = req.body;

    if (!reservationId) {
      return res.status(400).json({ message: 'Reservation ID is required' });
    }

    // Find products with this reservation
    const products = await Product.find({
      'reservations.reservationId': reservationId
    });

    if (products.length === 0) {
      return res.status(404).json({ message: 'Reservation not found or expired' });
    }

    const confirmationResults = [];

    for (const product of products) {
      const reservation = product.reservations.find(r => r.reservationId === reservationId);
      
      if (reservation && reservation.expiresAt > new Date()) {
        // Remove the reservation
        await Product.findByIdAndUpdate(
          product._id,
          {
            $pull: { reservations: { reservationId } }
          }
        );

        confirmationResults.push({
          productId: product._id,
          confirmed: true,
          quantity: reservation.quantity
        });
      } else {
        // Reservation expired, restore stock
        await Product.findByIdAndUpdate(
          product._id,
          {
            $inc: { quantity: reservation ? reservation.quantity : 0 },
            $pull: { reservations: { reservationId } }
          }
        );

        confirmationResults.push({
          productId: product._id,
          confirmed: false,
          reason: 'Reservation expired'
        });
      }
    }

    res.json({
      message: 'Stock reservation processed',
      confirmationResults
    });

  } catch (error) {
    console.error('Confirm stock reservation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Release stock reservation (cancel order)
const releaseStockReservation = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({ message: 'Reservation ID is required' });
    }

    // Find products with this reservation
    const products = await Product.find({
      'reservations.reservationId': reservationId
    });

    const releaseResults = [];

    for (const product of products) {
      const reservation = product.reservations.find(r => r.reservationId === reservationId);
      
      if (reservation) {
        // Check if product was out of stock before restoration
        const wasOutOfStock = product.quantity === 0;
        
        // Restore stock and remove reservation
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          {
            $inc: { quantity: reservation.quantity },
            $pull: { reservations: { reservationId } }
          },
          { new: true }
        );

        // Send back-in-stock notification if product was out of stock
        if (wasOutOfStock && updatedProduct.quantity > 0) {
          try {
            await sendProductNotification('product_back_in_stock', updatedProduct._id, {
              productName: updatedProduct.name,
              productId: updatedProduct._id,
              actionUrl: `/products/${updatedProduct._id}`,
              imageUrl: updatedProduct.images && updatedProduct.images.length > 0 ? updatedProduct.images[0] : null
            });
          } catch (notificationError) {
            console.error('Failed to send back-in-stock notification:', notificationError);
          }
        }

        releaseResults.push({
          productId: product._id,
          released: true,
          restoredQuantity: reservation.quantity
        });
      }
    }

    res.json({
      message: 'Stock reservation released',
      releaseResults
    });

  } catch (error) {
    console.error('Release stock reservation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get low stock products (admin only)
const getLowStockProducts = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const threshold = parseInt(req.query.threshold) || 10;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const lowStockProducts = await Product.find({
      quantity: { $lte: threshold }
    })
    .populate('seller', 'name email')
    .sort({ quantity: 1 })
    .skip(skip)
    .limit(limit);

    const totalProducts = await Product.countDocuments({
      quantity: { $lte: threshold }
    });

    res.json({
      products: lowStockProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        threshold
      }
    });

  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clean expired reservations (utility function)
const cleanExpiredReservations = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const now = new Date();
    
    // Find products with expired reservations
    const products = await Product.find({
      'reservations.expiresAt': { $lt: now }
    });

    let cleanedCount = 0;
    let restoredStock = 0;

    for (const product of products) {
      const expiredReservations = product.reservations.filter(r => r.expiresAt < now);
      const validReservations = product.reservations.filter(r => r.expiresAt >= now);
      
      if (expiredReservations.length > 0) {
        const stockToRestore = expiredReservations.reduce((sum, r) => sum + r.quantity, 0);
        const wasOutOfStock = product.quantity === 0;
        
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          {
            $inc: { quantity: stockToRestore },
            $set: { reservations: validReservations }
          },
          { new: true }
        );

        // Send back-in-stock notification if product was out of stock
        if (wasOutOfStock && updatedProduct.quantity > 0) {
          try {
            await sendProductNotification('product_back_in_stock', updatedProduct._id, {
              productName: updatedProduct.name,
              productId: updatedProduct._id,
              actionUrl: `/products/${updatedProduct._id}`,
              imageUrl: updatedProduct.images && updatedProduct.images.length > 0 ? updatedProduct.images[0] : null
            });
          } catch (notificationError) {
            console.error('Failed to send back-in-stock notification:', notificationError);
          }
        }

        cleanedCount += expiredReservations.length;
        restoredStock += stockToRestore;
      }
    }

    res.json({
      message: 'Expired reservations cleaned',
      cleanedReservations: cleanedCount,
      restoredStock
    });

  } catch (error) {
    console.error('Clean expired reservations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  checkStockAvailability,
  reserveStock,
  confirmStockReservation,
  releaseStockReservation,
  getLowStockProducts,
  cleanExpiredReservations
};