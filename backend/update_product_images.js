const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to the same database as the server (krishibazar1)
mongoose.connect('mongodb://localhost:27017/krishibazar1');

const updateProductImages = async () => {
  try {
    console.log('Connecting to krishibazar1 database...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    
    // Get ALL products
    const allDocs = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${allDocs.length} documents in products collection`);
    
    for (const product of allDocs) {
      let newImage = '/uploads/products/no-photo.jpg'; // default
      
      // Map products to appropriate actual images based on category and name
      const category = (product.category || '').toLowerCase();
      const name = (product.name || '').toLowerCase();
      
      if (category.includes('dairy') || name.includes('milk')) {
        newImage = '/uploads/products/fresh milk.jpg';
      } else if (category.includes('grains') || name.includes('rice') || name.includes('miniket')) {
        newImage = '/uploads/products/no-photo.jpg'; // No rice image available
      } else if (category.includes('meat') || category.includes('poultry') || name.includes('chicken')) {
        newImage = '/uploads/products/chicken.jpg';
      } else if (name.includes('honey')) {
        newImage = '/uploads/products/honey.jpg';
      } else if (name.includes('potato')) {
        newImage = '/uploads/products/potatoes.webp';
      } else if (name.includes('tomato')) {
        newImage = '/uploads/products/no-photo.jpg'; // No tomato image available
      }
      
      // Update using direct MongoDB collection update
      const result = await mongoose.connection.db.collection('products').updateOne(
        { _id: product._id },
        { $set: { images: [newImage] } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Updated product: ${product.name} with image: ${newImage}`);
      }
    }
    
    console.log('\nProduct image update completed!');
    
    // Verify the updates
    const updatedProducts = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log('\nUpdated products:');
    updatedProducts.forEach(product => {
      console.log(`- ${product.name}: ${product.images[0]}`);
    });
    
  } catch (error) {
    console.error('Error updating product images:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

updateProductImages();