const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title for the review'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
    maxlength: [500, 'Review cannot be more than 500 characters']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please add a rating between 1 and 5']
  },
  reviewType: {
    type: String,
    required: true,
    enum: ['product', 'seller', 'event', 'order']
  },
  // Reference to the item being reviewed
  reviewTarget: {
    type: mongoose.Schema.ObjectId,
    required: true,
    refPath: 'reviewType'
  },
  // Additional context for the review
  context: {
    // For product reviews - order ID if purchased
    orderId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order'
    },
    // For seller reviews - products purchased
    productsPurchased: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    }],
    // For event reviews - attendance confirmation
    eventAttended: {
      type: Boolean,
      default: false
    },
    // Purchase verification for authentic reviews
    verified: {
      type: Boolean,
      default: false
    }
  },
  // Review criteria breakdown
  criteria: {
    // For products
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    freshness: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    },
    // For sellers
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5
    },
    deliveryTime: {
      type: Number,
      min: 1,
      max: 5
    },
    // For events
    organization: {
      type: Number,
      min: 1,
      max: 5
    },
    content: {
      type: Number,
      min: 1,
      max: 5
    },
    venue: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  // Images attached to review
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: 'Review image'
    },
    caption: String
  }],
  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  // Moderation
  moderationNotes: String,
  flaggedBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Helpfulness tracking
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    helpful: {
      type: Boolean,
      required: true
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  // Response from seller/organizer
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  // Review author
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
ReviewSchema.index({ reviewType: 1, reviewTarget: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ 'context.verified': 1 });

// Prevent user from submitting more than one review per target
ReviewSchema.index({ user: 1, reviewTarget: 1 }, { unique: true });

// Virtual for overall helpfulness score
ReviewSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  if (total === 0) return 0;
  return (this.helpfulCount / total) * 100;
});

// Virtual for review age
ReviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to update timestamps
ReviewSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Static method to get average rating for a target
ReviewSchema.statics.getAverageRating = async function(reviewType, targetId) {
  const obj = await this.aggregate([
    {
      $match: {
        reviewTarget: targetId,
        reviewType: reviewType,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$reviewTarget',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  // Calculate rating distribution
  if (obj.length > 0) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    obj[0].ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
    obj[0].ratingDistribution = distribution;
  }

  return obj[0] || {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Static method to get criteria averages
ReviewSchema.statics.getCriteriaAverages = async function(reviewType, targetId) {
  const pipeline = [
    {
      $match: {
        reviewTarget: targetId,
        reviewType: reviewType,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$reviewTarget',
        avgQuality: { $avg: '$criteria.quality' },
        avgFreshness: { $avg: '$criteria.freshness' },
        avgPackaging: { $avg: '$criteria.packaging' },
        avgValueForMoney: { $avg: '$criteria.valueForMoney' },
        avgCommunication: { $avg: '$criteria.communication' },
        avgReliability: { $avg: '$criteria.reliability' },
        avgDeliveryTime: { $avg: '$criteria.deliveryTime' },
        avgOrganization: { $avg: '$criteria.organization' },
        avgContent: { $avg: '$criteria.content' },
        avgVenue: { $avg: '$criteria.venue' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

// Method to calculate helpfulness counts
ReviewSchema.methods.updateHelpfulnessCounts = function() {
  this.helpfulCount = this.helpfulVotes.filter(vote => vote.helpful).length;
  this.notHelpfulCount = this.helpfulVotes.filter(vote => !vote.helpful).length;
};

// Post-save middleware to update target's average rating
ReviewSchema.post('save', async function() {
  try {
    const stats = await this.constructor.getAverageRating(this.reviewType, this.reviewTarget);
    
    // Update the target model based on review type
    if (this.reviewType === 'product') {
      await mongoose.model('Product').findByIdAndUpdate(this.reviewTarget, {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews
      });
    } else if (this.reviewType === 'seller') {
      await mongoose.model('User').findByIdAndUpdate(this.reviewTarget, {
        'sellerStats.averageRating': stats.averageRating,
        'sellerStats.totalReviews': stats.totalReviews
      });
    } else if (this.reviewType === 'event') {
      await mongoose.model('Event').findByIdAndUpdate(this.reviewTarget, {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews
      });
    }
  } catch (error) {
    console.error('Error updating target rating:', error);
  }
});

// Post-remove middleware to recalculate ratings
ReviewSchema.post('deleteOne', { document: true, query: false }, async function() {
  try {
    const stats = await this.constructor.getAverageRating(this.reviewType, this.reviewTarget);
    
    // Update the target model based on review type
    if (this.reviewType === 'product') {
      await mongoose.model('Product').findByIdAndUpdate(this.reviewTarget, {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews
      });
    } else if (this.reviewType === 'seller') {
      await mongoose.model('User').findByIdAndUpdate(this.reviewTarget, {
        'sellerStats.averageRating': stats.averageRating,
        'sellerStats.totalReviews': stats.totalReviews
      });
    } else if (this.reviewType === 'event') {
      await mongoose.model('Event').findByIdAndUpdate(this.reviewTarget, {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews
      });
    }
  } catch (error) {
    console.error('Error updating target rating after deletion:', error);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);