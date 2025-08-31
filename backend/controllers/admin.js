const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Event = require('../models/Event');
const mongoose = require('mongoose');

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    const [userStats, orderStats, productStats, reviewStats, eventStats] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            },
            pendingVendors: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$role', 'vendor'] },
                      { $eq: ['$status', 'pending'] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            verifiedUsers: {
              $sum: {
                $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
              }
            }
          }
        }
      ]),
      
      // Order statistics
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
              }
            }
          }
        }
      ]),
      
      // Product statistics
      Product.aggregate([
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
                $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0]
              }
            },
            outOfStockProducts: {
              $sum: {
                $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 1, 0]
              }
            }
          }
        }
      ]),
      
      // Review statistics
      Review.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            pendingReviews: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            flaggedReviews: {
              $sum: {
                $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0]
              }
            },
            averageRating: { $avg: '$overallRating' }
          }
        }
      ]),
      
      // Event statistics
      Event.aggregate([
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            activeEvents: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$endDate', new Date()] },
                      { $eq: ['$status', 'active'] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            pendingEvents: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role status createdAt');

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('orderNumber totalAmount status createdAt user');

    const recentReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .populate('product', 'name')
      .select('overallRating comment status createdAt user product');

    res.json({
      success: true,
      data: {
        stats: {
          users: userStats[0] || { totalUsers: 0, activeUsers: 0, pendingVendors: 0, verifiedUsers: 0 },
          orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 },
          products: productStats[0] || { totalProducts: 0, activeProducts: 0, lowStockProducts: 0, outOfStockProducts: 0 },
          reviews: reviewStats[0] || { totalReviews: 0, pendingReviews: 0, flaggedReviews: 0, averageRating: 0 },
          events: eventStats[0] || { totalEvents: 0, activeEvents: 0, pendingEvents: 0 }
        },
        recentActivity: {
          users: recentUsers,
          orders: recentOrders,
          reviews: recentReviews
        }
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics',
      error: error.message
    });
  }
};

// Get all users with filtering and pagination
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;
    if (verified && verified !== 'all') filter.isVerified = verified === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password')
        .lean(),
      User.countDocuments(filter)
    ]);

    // Add user statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = {};
        
        if (user.role === 'consumer') {
          const orderCount = await Order.countDocuments({ user: user._id });
          stats.totalOrders = orderCount;
        }
        
        if (user.role === 'farmer' || user.role === 'vendor') {
          const [productCount, avgRating, totalRevenue] = await Promise.all([
            Product.countDocuments({ seller: user._id }),
            Review.aggregate([
              { $match: { seller: user._id } },
              { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
            ]),
            Order.aggregate([
              { $match: { 'items.seller': user._id, status: 'delivered' } },
              { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
          ]);
          
          stats.totalProducts = productCount;
          stats.averageRating = avgRating[0]?.avgRating || 0;
          stats.totalRevenue = totalRevenue[0]?.total || 0;
        }
        
        return { ...user, stats };
      })
    );

    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user details by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional user data based on role
    let additionalData = {};
    
    if (user.role === 'consumer') {
      const [orders, reviews] = await Promise.all([
        Order.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('orderNumber totalAmount status createdAt'),
        Review.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('product', 'name')
          .select('overallRating comment status createdAt product')
      ]);
      
      additionalData = { recentOrders: orders, recentReviews: reviews };
    }
    
    if (user.role === 'farmer' || user.role === 'vendor') {
      const [products, orders, reviews] = await Promise.all([
        Product.find({ seller: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('name price quantity status createdAt'),
        Order.find({ 'items.seller': userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('orderNumber totalAmount status createdAt'),
        Review.find({ seller: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('user', 'name')
          .populate('product', 'name')
          .select('overallRating comment status createdAt user product')
      ]);
      
      additionalData = { products, recentOrders: orders, reviews };
    }

    res.json({
      success: true,
      data: {
        user,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status
    user.status = status;
    if (status === 'suspended' && reason) {
      user.suspensionReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = req.user.id;
    }

    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { user: { ...user.toObject(), password: undefined } }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['consumer', 'farmer', 'vendor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing the role of the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change role of the last admin user'
        });
      }
    }

    user.role = role;
    user.roleUpdatedBy = req.user.id;
    user.roleUpdatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user: { ...user.toObject(), password: undefined } }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Approve vendor
const approveVendor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'vendor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a vendor'
      });
    }

    // Update vendor approval status
    user.status = 'active';
    user.isVerified = true;
    if (!user.vendorInfo) {
      user.vendorInfo = {};
    }
    user.vendorInfo.approvalStatus = 'approved';
    user.vendorInfo.approvedBy = req.user.id;
    user.vendorInfo.approvedAt = new Date();
    if (notes) {
      user.vendorInfo.approvalNotes = notes;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Vendor approved successfully',
      data: { user: { ...user.toObject(), password: undefined } }
    });
  } catch (error) {
    console.error('Error approving vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve vendor',
      error: error.message
    });
  }
};

// Reject vendor
const rejectVendor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'vendor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a vendor'
      });
    }

    // Update vendor rejection status
    user.status = 'inactive';
    if (!user.vendorInfo) {
      user.vendorInfo = {};
    }
    user.vendorInfo.approvalStatus = 'rejected';
    user.vendorInfo.rejectedBy = req.user.id;
    user.vendorInfo.rejectedAt = new Date();
    user.vendorInfo.rejectionReason = reason;
    if (notes) {
      user.vendorInfo.rejectionNotes = notes;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Vendor rejected successfully',
      data: { user: { ...user.toObject(), password: undefined } }
    });
  } catch (error) {
    console.error('Error rejecting vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject vendor',
      error: error.message
    });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    // Soft delete
    user.status = 'deleted';
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    if (reason) {
      user.deletionReason = reason;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Bulk user operations
const bulkUserOperation = async (req, res) => {
  try {
    const { userIds, operation, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const validOperations = ['activate', 'suspend', 'delete', 'update_role'];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation'
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let updateQuery = {};
      
      switch (operation) {
        case 'activate':
          updateQuery = { status: 'active' };
          break;
        case 'suspend':
          updateQuery = {
            status: 'suspended',
            suspendedAt: new Date(),
            suspendedBy: req.user.id
          };
          if (data?.reason) {
            updateQuery.suspensionReason = data.reason;
          }
          break;
        case 'delete':
          updateQuery = {
            status: 'deleted',
            deletedAt: new Date(),
            deletedBy: req.user.id
          };
          if (data?.reason) {
            updateQuery.deletionReason = data.reason;
          }
          break;
        case 'update_role':
          if (!data?.role) {
            throw new Error('Role is required for role update operation');
          }
          updateQuery = {
            role: data.role,
            roleUpdatedBy: req.user.id,
            roleUpdatedAt: new Date()
          };
          break;
      }

      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: updateQuery },
        { session }
      );

      await session.commitTransaction();

      res.json({
        success: true,
        message: `Bulk ${operation} completed successfully`,
        data: {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount
        }
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error in bulk user operation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operation',
      error: error.message
    });
  }
};

module.exports = {
  getPlatformStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  approveVendor,
  rejectVendor,
  deleteUser,
  bulkUserOperation
};