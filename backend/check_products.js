const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const checkProducts = async () => {
  try {
    const products = await Product.find({});
    console.log('Total products:', products.length);
    
    if (products.length > 0) {
      console.log('\nProducts found:');
      products.forEach(p => {
        console.log(`- ${p.name} (${p.category}) - Active: ${p.isActive || 'undefined'}`);
      });
    } else {
      console.log('No products found in database');
    }
    
    process.exit();
  } catch (err) {
    console.error('Error checking products:', err);
    process.exit(1);
  }
};

checkProducts();