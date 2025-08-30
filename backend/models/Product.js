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
    default: ['no-photo.jpg']
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

// Call getAverageRating after save
ProductSchema.post('save', function() {
  this.constructor.getAverageRating(this._id);
});

module.exports = mongoose.model('Product', ProductSchema);