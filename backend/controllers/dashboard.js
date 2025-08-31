const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const mongoose = require('mongoose');

// @desc    Get farmer/vendor dashboard data
// @route   GET /api/dashboard/vendor
// @access  Private (Farmer/Vendor)
const getVendorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify user is farmer or vendor
    if (!['farmer', 'vendor'].includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Only farmers and vendors can access this dashboard.' });
    }

    // Get orders statistics
    const ordersStats = await Order.aggregate([
      {
        $match: {
          'items.seller': new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing']] }, 1, 0]
            }
          },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
            }
          },
          totalRevenue: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $cond: [
                    { $eq: ['$$this.seller', new mongoose.Types.ObjectId(userId)] },
                    { $add: ['$$value', '$$this.totalPrice'] },
                    '$$value'
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({
      'items.seller': userId
    })
    .populate('user', 'name email phone')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderId status createdAt orderSummary items user paymentMethod');

    // Get monthly earnings for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await Order.aggregate([
      {
        $match: {
          'items.seller': new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sixMonthsAgo },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          earnings: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $cond: [
                    { $eq: ['$$this.seller', new mongoose.Types.ObjectId(userId)] },
                    { $add: ['$$value', '$$this.totalPrice'] },
                    '$$value'
                  ]
                }
              }
            }
          },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get user ratings and reviews summary
    const user = await User.findById(userId).select('averageRating totalReviews');
    
    // Get recent reviews
    const recentReviews = await Review.find({
      reviewType: 'seller',
      targetId: userId
    })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('rating comment createdAt user');

    // Get product statistics
    const productStats = await Product.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          lowStockProducts: {
            $sum: {
              $cond: [{ $and: [{ $lte: ['$quantity', 10] }, { $gt: ['$quantity', 0] }] }, 1, 0]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = ordersStats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0
    };

    const products = productStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0
    };

    res.status(200).json({
      success: true,
      data: {
        orderStats: stats,
        productStats: products,
        recentOrders,
        monthlyEarnings,
        ratingSummary: {
          averageRating: user?.averageRating || 0,
          totalReviews: user?.totalReviews || 0
        },
        recentReviews
      }
    });
  } catch (error) {
    console.error('Error fetching vendor dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get consumer dashboard data
// @route   GET /api/dashboard/consumer
// @access  Private (Consumer)
const getConsumerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify user is consumer
    if (userRole !== 'consumer') {
      return res.status(403).json({ message: 'Access denied. Only consumers can access this dashboard.' });
    }

    // Get order statistics
    const orderStats = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing', 'packed', 'out_for_delivery']] }, 1, 0]
            }
          },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, '$orderSummary.total', 0]
            }
          }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({
      user: userId
    })
    .populate('items.product', 'name images seller')
    .populate('items.seller', 'name businessName')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderId status createdAt orderSummary items paymentMethod estimatedDelivery');

    // Get monthly spending for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpending = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sixMonthsAgo },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          spending: { $sum: '$orderSummary.total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get user's reviews given
    const reviewsGiven = await Review.find({
      user: userId
    })
    .populate('targetId', 'name businessName')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('rating comment createdAt reviewType targetId');

    // Get review statistics
    const reviewStats = await Review.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRatingGiven: { $avg: '$rating' }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0
    };

    const reviews = reviewStats[0] || {
      totalReviews: 0,
      averageRatingGiven: 0
    };

    res.status(200).json({
      success: true,
      data: {
        orderStats: stats,
        recentOrders,
        monthlySpending,
        reviewStats: reviews,
        reviewsGiven
      }
    });
  } catch (error) {
    console.error('Error fetching consumer dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get vendor earnings analytics
// @route   GET /api/dashboard/vendor/analytics
// @access  Private (Farmer/Vendor)
const getVendorAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = '6months' } = req.query;

    // Verify user is farmer or vendor
    if (!['farmer', 'vendor'].includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Only farmers and vendors can access this analytics.' });
    }

    let dateFilter;
    const now = new Date();

    switch (period) {
      case '1month':
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6months':
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1year':
        dateFilter = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }

    // Get detailed analytics
    const analytics = await Order.aggregate([
      {
        $match: {
          'items.seller': new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: dateFilter },
          status: 'delivered'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.seller': new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: {
            productId: '$items.product',
            productName: '$productInfo.name',
            category: '$productInfo.category'
          },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$items.totalPrice' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getVendorDashboard,
  getConsumerDashboard,
  getVendorAnalytics
};