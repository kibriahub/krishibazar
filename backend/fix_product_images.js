const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to the same database as the server (krishibazar1)
mongoose.connect('mongodb://localhost:27017/krishibazar1');

const fixProductImages = async () => {
  try {
    console.log('Connecting to krishibazar1 database...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    
    // Get ALL products
    const allDocs = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${allDocs.length} documents in products collection`);
    
    for (const product of allDocs) {
      let newImage = 'tomato.svg'; // default
      
      // Map products to appropriate SVG images based on category and name
      const category = (product.category || '').toLowerCase();
      const name = (product.name || '').toLowerCase();
      
      if (category.includes('dairy') || name.includes('milk')) {
        newImage = 'rice.svg';
      } else if (category.includes('grains') || name.includes('rice') || name.includes('wheat')) {
        newImage = 'rice.svg';
      } else if (category.includes('meat') || name.includes('chicken') || name.includes('beef')) {
        newImage = 'chicken.svg';
      } else if (category.includes('fish') || name.includes('fish') || name.includes('seafood')) {
        newImage = 'fish.svg';
      } else if (name.includes('honey')) {
        newImage = 'tomato.svg';
      } else if (name.includes('potato')) {
        newImage = 'tomato.svg';
      } else {
        newImage = 'tomato.svg';
      }
      
      // Update using direct MongoDB collection update
      await mongoose.connection.db.collection('products').updateOne(
        { _id: product._id },
        { $set: { images: [newImage] } }
      );
      
      console.log(`Updated ${product.name}: ${JSON.stringify(product.images)} -> [${newImage}]`);
    }
    
    console.log('All products updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixProductImages();