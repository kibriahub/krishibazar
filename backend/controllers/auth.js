const User = require('../models/User');
const OTP = require('../models/OTP');
const crypto = require('crypto');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// @desc    Register user (Step 1: Create user and send OTP)
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, city } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user with email verification set to false for new registrations
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      address,
      city: city || 'Dhaka', // Default to Dhaka if not provided
      isEmailVerified: false // New users need to verify email
    });

    // Generate and save OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);
    
    if (!emailResult.success) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for OTP verification.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Verify OTP (Step 2: Complete registration)
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and OTP'
      });
    }

    // Find valid OTP
    const otpRecord = await OTP.findValidOTP(email, otp);
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Find user and update verification status
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user verification status
    user.isEmailVerified = true;
    await user.save();

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Send token response for successful verification
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate and save new OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully! Please check your email.'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if email is verified (only for new users, existing users have isEmailVerified: true by default)
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, businessName, businessDescription } = req.body;

    // Validate phone number if provided
    if (phone && (!/^01\d{9}$/.test(phone))) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be 11 digits starting with 01'
      });
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (businessName) updateFields.businessName = businessName;
    if (businessDescription) updateFields.businessDescription = businessDescription;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, city } = req.body;

    if (!email || !city) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and city hint'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email'
      });
    }

    // Verify city hint (trim and case-insensitive comparison)
    const userCity = user.city.trim().toLowerCase();
    const inputCity = city.trim().toLowerCase();
    
    if (userCity !== inputCity) {
      return res.status(400).json({
        success: false,
        error: 'City hint does not match our records'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'City hint verified successfully. You can now reset your password.',
      resetToken: resetToken
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Remove password from user object
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj
  });
};