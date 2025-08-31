const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const createTestConsumer = async () => {
  try {
    // Check if test consumer already exists
    const existingConsumer = await User.findOne({ email: 'testconsumer@example.com' });
    
    if (existingConsumer) {
      console.log('Test consumer already exists');
      console.log('Email: testconsumer@example.com');
      console.log('Password: password123');
      process.exit();
    }

    const testConsumer = {
      name: 'Test Consumer',
      email: 'testconsumer@example.com',
      password: 'password123',
      phone: '01712345680',
      role: 'consumer',
      address: '123 Test Street, Dhaka',
      isEmailVerified: true
    };

    await User.create(testConsumer);
    console.log('Test consumer created successfully');
    console.log('Email: testconsumer@example.com');
    console.log('Password: password123');
    process.exit();
  } catch (err) {
    console.error('Error creating test consumer:', err);
    process.exit(1);
  }
};

createTestConsumer();