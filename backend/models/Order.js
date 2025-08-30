const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  seller: {
    type: String,
    required: true
  },
  sellerType: {
    type: String,
    enum: ['farmer', 'vendor'],
    required: true
  }
});

const deliveryAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  deliveryAddress: deliveryAddressSchema,
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'mobile_banking', 'card'],
    required: true
  },
  paymentDetails: {
    mobileNumber: String,
    transactionId: String,
    cardLast4: String
  },
  orderSummary: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 50
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderId = `KB${timestamp.slice(-6)}${random}`;
  }
  
  // Set estimated delivery (2-3 days from now)
  if (!this.estimatedDelivery) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    this.estimatedDelivery = deliveryDate;
  }
  
  // Initialize status history
  if (this.isNew) {
    this.statusHistory = [{
      status: 'pending',
      timestamp: new Date(),
      note: 'Order placed successfully'
    }];
  }
  
  next();
});

// Update status history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Order status updated to ${this.status}`
    });
    
    // Set actual delivery date when delivered
    if (this.status === 'delivered' && !this.actualDelivery) {
      this.actualDelivery = new Date();
    }
  }
  next();
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for delivery status
orderSchema.virtual('deliveryStatus').get(function() {
  if (this.status === 'delivered') return 'delivered';
  if (this.status === 'cancelled') return 'cancelled';
  if (this.estimatedDelivery && new Date() > this.estimatedDelivery) return 'delayed';
  return 'on_time';
});

// Index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);