const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // OTP expires after 10 minutes (600 seconds)
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3 // Maximum 3 verification attempts
  }
});

// Index for faster queries
otpSchema.index({ email: 1, createdAt: 1 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  const now = new Date();
  const expiryTime = new Date(this.createdAt.getTime() + 10 * 60 * 1000); // 10 minutes
  return now > expiryTime;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = function(email, otp) {
  return this.findOne({
    email: email.toLowerCase(),
    otp: otp,
    verified: false,
    attempts: { $lt: 3 }
  });
};

// Static method to cleanup expired OTPs
otpSchema.statics.cleanupExpired = function() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: tenMinutesAgo }
  });
};

module.exports = mongoose.model('OTP', otpSchema);