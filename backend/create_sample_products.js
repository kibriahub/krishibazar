const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const createSampleProducts = async () => {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    
    if (existingProducts > 0) {
      console.log(`${existingProducts} products already exist in database`);
      process.exit();
    }

    // Find a vendor to assign products to
    let vendor = await User.findOne({ role: 'vendor' });
    
    if (!vendor) {
      console.log('No vendor found. Creating test vendor first...');
      vendor = await User.create({
        name: 'Sample Farmer',
        email: 'samplefarmer@example.com',
        password: 'password123',
        phone: '01712345681',
        role: 'vendor',
        businessName: 'Green Valley Farm',
        businessDescription: 'Organic produce from our family farm',
        isEmailVerified: true
      });
    }

    const sampleProducts = [
      {
        name: 'Fresh Tomatoes',
        description: 'Organic red tomatoes, freshly harvested',
        price: 80,
        category: 'Vegetables',
        unit: 'kg',
        stock: 100,
        images: ['tomato.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Basmati Rice',
        description: 'Premium quality basmati rice',
        price: 120,
        category: 'Grains',
        unit: 'kg',
        stock: 200,
        images: ['rice.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Fresh Milk',
        description: 'Pure cow milk, delivered fresh daily',
        price: 60,
        category: 'Dairy',
        unit: 'liter',
        stock: 50,
        images: ['rice.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Free Range Chicken',
        description: 'Healthy free-range chicken, antibiotic-free',
        price: 350,
        category: 'Meat',
        unit: 'kg',
        stock: 30,
        images: ['chicken.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Fresh Potatoes',
        description: 'Farm-fresh potatoes, perfect for cooking',
        price: 40,
        category: 'Vegetables',
        unit: 'kg',
        stock: 150,
        images: ['tomato.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Natural Honey',
        description: 'Pure natural honey from local beehives',
        price: 450,
        category: 'Natural Products',
        unit: 'kg',
        stock: 25,
        images: ['tomato.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Fresh Fish',
        description: 'Daily catch fresh fish from local rivers',
        price: 280,
        category: 'Seafood',
        unit: 'kg',
        stock: 40,
        images: ['fish.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Wheat Flour',
        description: 'Stone-ground wheat flour, chemical-free',
        price: 55,
        category: 'Grains',
        unit: 'kg',
        stock: 80,
        images: ['rice.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Fresh Carrots',
        description: 'Crunchy orange carrots, rich in vitamins',
        price: 70,
        category: 'Vegetables',
        unit: 'kg',
        stock: 60,
        images: ['tomato.svg'],
        vendor: vendor._id,
        isActive: true
      },
      {
        name: 'Farm Eggs',
        description: 'Fresh eggs from free-range hens',
        price: 12,
        category: 'Dairy',
        unit: 'piece',
        stock: 200,
        images: ['rice.svg'],
        vendor: vendor._id,
        isActive: true
      }
    ];

    await Product.create(sampleProducts);
    console.log(`${sampleProducts.length} sample products created successfully`);
    console.log('Products include various categories: Vegetables, Grains, Dairy, Meat, Seafood, Natural Products');
    process.exit();
  } catch (err) {
    console.error('Error creating sample products:', err);
    process.exit(1);
  }
};

createSampleProducts();