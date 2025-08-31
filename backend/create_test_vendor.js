const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const createTestVendor = async () => {
  try {
    // Check if test vendor already exists
    const existingVendor = await User.findOne({ email: 'testvendor@example.com' });
    
    if (existingVendor) {
      console.log('Test vendor already exists');
      console.log('Email: testvendor@example.com');
      console.log('Password: password123');
      process.exit();
    }

    const testVendor = {
      name: 'Test Vendor',
      email: 'testvendor@example.com',
      password: 'password123',
      phone: '01712345679',
      role: 'vendor',
      businessName: 'Test Farm',
      businessDescription: 'A test farm for dashboard testing',
      isEmailVerified: true
    };

    await User.create(testVendor);
    console.log('Test vendor created successfully');
    console.log('Email: testvendor@example.com');
    console.log('Password: password123');
    process.exit();
  } catch (err) {
    console.error('Error creating test vendor:', err);
    process.exit(1);
  }
};

createTestVendor();