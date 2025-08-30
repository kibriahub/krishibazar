const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Load models
const Product = require('./models/Product');
const User = require('./models/User');

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Read JSON files (only when needed)
let products, users;

try {
  products = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/products.json`, 'utf-8')
  );
  users = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
  );
} catch (err) {
  // Files don't exist, will be handled in individual functions
}

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit();
    }

    const adminUser = {
      name: 'Admin',
      email: 'admin@admin.com',
      password: 'example123',
      phone: '01712345678',
      role: 'admin'
    };

    await User.create(adminUser);
    console.log('Admin user created successfully');
    process.exit();
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

// Import into DB
const importData = async () => {
  try {
    await Product.create(products);
    await User.create(users);

    console.log('Data Imported...');
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed...');
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else if (process.argv[2] === '-admin') {
  createAdmin();
}