const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse the query
    let query = Review.find(JSON.parse(queryStr));

    // Only show approved reviews by default
    if (!reqQuery.status) {
      query = query.find({ status: 'approved' });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Review.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate user information
    query = query.populate({
      path: 'user',
      select: 'name email role'
    });

    // Populate response user if exists
    query = query.populate({
      path: 'response.respondedBy',
      select: 'name role'
    });

    // Executing query
    const reviews = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination,
      data: reviews
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get reviews for a specific target
// @route   GET /api/v1/reviews/:reviewType/:targetId
// @access  Public
exports.getTargetReviews = async (req, res, next) => {
  try {
    console.log('=== BACKEND getTargetReviews DEBUG START ===');
    const { reviewType, targetId } = req.params;
    console.log('Request params:', { reviewType, targetId });
    console.log('Request query:', req.query);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const sortBy = req.query.sort || '-createdAt';
    const rating = req.query.rating;
    const verified = req.query.verified;

    // Build query
    let query = {
      reviewTarget: targetId,
      reviewType: reviewType,
      status: 'approved'
    };

    // Filter by rating if specified
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Filter by verified reviews if specified
    if (verified === 'true') {
      query['context.verified'] = true;
    }

    console.log('Query object:', query);
    const total = await Review.countDocuments(query);
    console.log('Total reviews found:', total);
    
    const reviews = await Review.find(query)
      .sort(sortBy)
      .skip(startIndex)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'name role'
      })
      .populate({
        path: 'response.respondedBy',
        select: 'name role'
      });

    console.log('Reviews retrieved:', reviews.length);
    console.log('First review (if any):', reviews[0] ? reviews[0].title : 'No reviews');

    // Get rating statistics
    const stats = await Review.getAverageRating(reviewType, targetId);
    const criteriaStats = await Review.getCriteriaAverages(reviewType, targetId);
    console.log('Stats:', stats);
    console.log('Criteria stats:', criteriaStats);

    // Pagination result
    const pagination = {};
    const endIndex = page * limit;

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    const responseData = {
      success: true,
      count: reviews.length,
      total,
      pagination,
      stats: {
        ...stats,
        criteria: criteriaStats
      },
      data: reviews
    };
    
    console.log('Response data structure:', {
      success: responseData.success,
      count: responseData.count,
      total: responseData.total,
      hasStats: !!responseData.stats,
      hasData: !!responseData.data,
      dataLength: responseData.data.length
    });
    console.log('=== BACKEND getTargetReviews DEBUG END ===');
    
    res.status(200).json(responseData);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name role'
      })
      .populate({
        path: 'response.respondedBy',
        select: 'name role'
      });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create new review
// @route   POST /api/v1/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  console.log('\n*** CREATEREVIEW FUNCTION CALLED ***');
  try {
    console.log('\n\n=== CREATE REVIEW FUNCTION CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user.id);
    console.log('User object:', req.user);
    
    req.body.user = req.user.id;

    // Map targetId to reviewTarget for compatibility
    if (req.body.targetId && !req.body.reviewTarget) {
      req.body.reviewTarget = req.body.targetId;
    }

    const { reviewType, reviewTarget } = req.body;
    console.log('Review type:', reviewType);
    console.log('Review target:', reviewTarget);

    // Verify the target exists
    let targetExists = false;
    if (reviewType === 'product') {
      targetExists = await Product.findById(reviewTarget);
    } else if (reviewType === 'seller') {
      targetExists = await User.findById(reviewTarget);
    } else if (reviewType === 'event') {
      targetExists = await Event.findById(reviewTarget);
    } else if (reviewType === 'order') {
      targetExists = await Order.findById(reviewTarget);
    }

    if (!targetExists) {
      return res.status(404).json({
        success: false,
        error: `${reviewType} not found`
      });
    }

    // Check if user has already reviewed this target
    const existingReview = await Review.findOne({
      user: req.user.id,
      reviewTarget: reviewTarget
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this item'
      });
    }

    // Verify purchase for product reviews (optional but recommended)
    if (reviewType === 'product' && req.body.context?.orderId) {
      const order = await Order.findOne({
        _id: req.body.context.orderId,
        user: req.user.id,
        'items.product': reviewTarget,
        status: 'delivered'
      });

      if (order) {
        req.body.context.verified = true;
      }
    }

    // Verify event attendance
    if (reviewType === 'event') {
      const event = await Event.findOne({
        _id: reviewTarget,
        'attendees.user': req.user.id,
        'attendees.status': 'confirmed'
      });

      if (event) {
        req.body.context.eventAttended = true;
        req.body.context.verified = true;
      }
    }

    console.log('Creating review with data:', JSON.stringify(req.body, null, 2));
    const review = await Review.create(req.body);
    console.log('Review created successfully:', review._id);

    // Populate user information before sending response
    try {
      await review.populate({
        path: 'user',
        select: 'name role'
      });
      console.log('Review populated successfully');
    } catch (populateErr) {
      console.log('Populate error (non-critical):', populateErr.message);
      // Continue without populate if it fails
    }

    console.log('Review ready to send');
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (err) {
    console.log('=== CREATE REVIEW ERROR ===');
    console.log('Error message:', err.message);
    console.log('Error stack:', err.stack);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Make sure user is review owner
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this review'
      });
    }

    // Don't allow updating certain fields
    const restrictedFields = ['user', 'reviewTarget', 'reviewType', 'context', 'helpfulVotes'];
    restrictedFields.forEach(field => delete req.body[field]);

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'user',
      select: 'name role'
    });

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Make sure user is review owner or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Vote on review helpfulness
// @route   POST /api/v1/reviews/:id/vote
// @access  Private
exports.voteOnReview = async (req, res, next) => {
  try {
    const { helpful } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if user has already voted
    const existingVoteIndex = review.helpfulVotes.findIndex(
      vote => vote.user.toString() === req.user.id.toString()
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      review.helpfulVotes[existingVoteIndex].helpful = helpful;
      review.helpfulVotes[existingVoteIndex].votedAt = new Date();
    } else {
      // Add new vote
      review.helpfulVotes.push({
        user: req.user.id,
        helpful: helpful
      });
    }

    // Update counts
    review.updateHelpfulnessCounts();
    await review.save();

    res.status(200).json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        notHelpfulCount: review.notHelpfulCount,
        helpfulnessScore: review.helpfulnessScore
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Flag review
// @route   POST /api/v1/reviews/:id/flag
// @access  Private
exports.flagReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if user has already flagged this review
    const alreadyFlagged = review.flaggedBy.find(
      flag => flag.user.toString() === req.user.id.toString()
    );

    if (alreadyFlagged) {
      return res.status(400).json({
        success: false,
        error: 'You have already flagged this review'
      });
    }

    review.flaggedBy.push({
      user: req.user.id,
      reason: reason
    });

    // Auto-flag if multiple users flag it
    if (review.flaggedBy.length >= 3 && review.status !== 'flagged') {
      review.status = 'flagged';
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review flagged successfully'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Add response to review (seller/organizer only)
// @route   POST /api/v1/reviews/:id/response
// @access  Private
exports.addResponse = async (req, res, next) => {
  try {
    const { text } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if user is authorized to respond
    let authorized = false;
    
    if (review.reviewType === 'product') {
      const product = await Product.findById(review.reviewTarget);
      if (product && product.seller.toString() === req.user.id) {
        authorized = true;
      }
    } else if (review.reviewType === 'seller') {
      if (review.reviewTarget.toString() === req.user.id) {
        authorized = true;
      }
    } else if (review.reviewType === 'event') {
      const event = await Event.findById(review.reviewTarget);
      if (event && event.organizer.toString() === req.user.id) {
        authorized = true;
      }
    }

    // Admin can always respond
    if (req.user.role === 'admin') {
      authorized = true;
    }

    if (!authorized) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to respond to this review'
      });
    }

    review.response = {
      text: text,
      respondedBy: req.user.id,
      respondedAt: new Date()
    };

    await review.save();

    // Populate the response user
    await review.populate({
      path: 'response.respondedBy',
      select: 'name role'
    });

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/v1/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const reviewType = req.query.reviewType;

    let query = {
      user: req.params.userId,
      status: 'approved'
    };

    if (reviewType) {
      query.reviewType = reviewType;
    }

    const total = await Review.countDocuments(query);
    
    const reviews = await Review.find(query)
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'name role'
      });

    // Pagination result
    const pagination = {};
    const endIndex = page * limit;

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination,
      data: reviews
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Moderate review (admin only)
// @route   PUT /api/v1/reviews/:id/moderate
// @access  Private (Admin)
exports.moderateReview = async (req, res, next) => {
  try {
    const { status, moderationNotes } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        status: status,
        moderationNotes: moderationNotes
      },
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'user',
      select: 'name email role'
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get reviewable products for user (from completed orders)
// @route   GET /api/v1/reviews/reviewable-products
// @access  Private
exports.getReviewableProducts = async (req, res, next) => {
  try {
    // Get delivered orders for the user
    const orders = await Order.find({
      user: req.user.id,
      status: 'delivered'
    }).populate('items.product', 'name images price seller');

    if (!orders.length) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get all products from delivered orders
    const productIds = [];
    const productOrderMap = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product) {
          productIds.push(item.product._id.toString());
          productOrderMap[item.product._id.toString()] = {
            orderId: order._id,
            orderDate: order.createdAt,
            deliveryDate: order.actualDelivery || order.updatedAt
          };
        }
      });
    });

    // Remove duplicates
    const uniqueProductIds = [...new Set(productIds)];

    // Get existing reviews for these products by this user
    const existingReviews = await Review.find({
      user: req.user.id,
      reviewType: 'product',
      reviewTarget: { $in: uniqueProductIds }
    }).select('reviewTarget');

    const reviewedProductIds = existingReviews.map(review => review.reviewTarget.toString());

    // Filter out already reviewed products
    const reviewableProductIds = uniqueProductIds.filter(
      productId => !reviewedProductIds.includes(productId)
    );

    // Get product details for reviewable products
    const reviewableProducts = await Product.find({
      _id: { $in: reviewableProductIds }
    }).populate('seller', 'name businessName');

    // Add order context to each product
    const productsWithContext = reviewableProducts.map(product => ({
      ...product.toObject(),
      orderContext: productOrderMap[product._id.toString()]
    }));

    res.status(200).json({
      success: true,
      count: productsWithContext.length,
      data: productsWithContext
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get review statistics
// @route   GET /api/v1/reviews/stats
// @access  Private (Admin)
exports.getReviewStats = async (req, res, next) => {
  try {
    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ status: 'approved' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const flaggedReviews = await Review.countDocuments({ status: 'flagged' });
    const rejectedReviews = await Review.countDocuments({ status: 'rejected' });
    const verifiedReviews = await Review.countDocuments({ 'context.verified': true });

    // Average rating across all reviews
    const avgRatingResult = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    // Reviews by type
    const reviewsByType = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$reviewType', count: { $sum: 1 } } }
    ]);

    // Reviews by rating
    const reviewsByRating = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Recent reviews (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = await Review.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        approvedReviews,
        pendingReviews,
        flaggedReviews,
        rejectedReviews,
        verifiedReviews,
        averageRating: avgRatingResult[0]?.averageRating || 0,
        reviewsByType: reviewsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        reviewsByRating: reviewsByRating.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentReviews
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};