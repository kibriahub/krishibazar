const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Fruits',
      'Vegetables',
      'Dairy',
      'Grains',
      'Meat',
      'Poultry',
      'Seafood',
      'Other'
    ]
  },
  quantity: {
    type: Number,
    required: [true, 'Please add available quantity']
  },
  unit: {
    type: String,
    required: [true, 'Please specify the unit'],
    enum: ['kg', 'g', 'lb', 'oz', 'piece', 'dozen', 'liter', 'ml']
  },
  images: {
    type: [String],
    default: ['no-photo.svg']
  },
  isSeasonal: {
    type: Boolean,
    default: false
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sellerType: {
    type: String,
    enum: ['farmer', 'vendor'],
    required: true
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  ratings: [
    {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comment: String,
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // Inventory management
  reservations: [{
    reservationId: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  suspensionReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate average rating
ProductSchema.statics.getAverageRating = async function(productId) {
  const obj = await this.aggregate([
    {
      $match: { _id: productId }
    },
    {
      $unwind: '$ratings'
    },
    {
      $group: {
        _id: '$_id',
        averageRating: { $avg: '$ratings.rating' }
      }
    }
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(productId, {
      averageRating: obj[0]?.averageRating || 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Update stock status based on quantity
ProductSchema.pre('save', function(next) {
  if (this.quantity === 0) {
    this.stockStatus = 'out_of_stock';
  } else if (this.quantity <= this.lowStockThreshold) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  next();
});

// Instance method to check available stock (excluding reservations)
ProductSchema.methods.getAvailableStock = function() {
  const reservedQuantity = this.reservations
    .filter(r => r.expiresAt > new Date())
    .reduce((sum, r) => sum + r.quantity, 0);
  return Math.max(0, this.quantity - reservedQuantity);
};

// Instance method to clean expired reservations
ProductSchema.methods.cleanExpiredReservations = async function() {
  const now = new Date();
  const expiredReservations = this.reservations.filter(r => r.expiresAt <= now);
  const validReservations = this.reservations.filter(r => r.expiresAt > now);
  
  if (expiredReservations.length > 0) {
    const stockToRestore = expiredReservations.reduce((sum, r) => sum + r.quantity, 0);
    this.quantity += stockToRestore;
    this.reservations = validReservations;
    await this.save();
    return stockToRestore;
  }
  return 0;
};

// Call getAverageRating after save
ProductSchema.post('save', function() {
  this.constructor.getAverageRating(this._id);
});

module.exports = mongoose.model('Product', ProductSchema);