const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    match: [
      /^01[0-9]{9}$/,
      'Phone number must be 11 digits starting with 01'
    ],
    maxlength: [11, 'Phone number must be exactly 11 digits']
  },
  address: {
    type: String,
    maxlength: [200, 'Address cannot be longer than 200 characters']
  },
  role: {
    type: String,
    enum: ['consumer', 'farmer', 'vendor', 'admin'],
    default: 'consumer'
  },
  // Fields specific to farmers and vendors
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot be more than 100 characters']
  },
  businessDescription: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  // For tracking user preferences
  preferences: {
    type: Object,
    default: {}
  },
  // Review-related fields for sellers
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);