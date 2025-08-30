const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/krishibazar');

async function updateProductsWithImagesAndReviews() {
  try {
    // Get all products and users
    const products = await Product.find({}).lean(); // Use lean() to get plain objects
    const users = await User.find({});
    
    console.log(`Found ${products.length} products and ${users.length} users`);
    
    // Define image mappings based on product names/categories
    const imageMap = {
      'mango': 'tomato.svg',
      'spinach': 'tomato.svg',
      'milk': 'rice.svg',
      'rice': 'rice.svg',
      'chicken': 'chicken.svg',
      'fish': 'fish.svg',
      'honey': 'tomato.svg',
      'potato': 'tomato.svg',
      'tomato': 'tomato.svg',
      'vegetable': 'tomato.svg',
      'fruit': 'tomato.svg',
      'dairy': 'rice.svg',
      'grain': 'rice.svg'
    };
    
    // Sample reviews
    const sampleReviews = [
      { rating: 5, comment: 'Excellent quality! Fresh and delicious.' },
      { rating: 4, comment: 'Very good product, will buy again.' },
      { rating: 5, comment: 'Amazing taste and freshness. Highly recommended!' },
      { rating: 4, comment: 'Good value for money. Quality is consistent.' },
      { rating: 5, comment: 'Best quality I have found in the market.' },
      { rating: 3, comment: 'Decent quality, could be better.' },
      { rating: 4, comment: 'Fresh and well-packaged. Satisfied with purchase.' },
      { rating: 5, comment: 'Outstanding! Will definitely order again.' }
    ];
    
    for (let productData of products) {
      console.log(`\nUpdating product: ${productData.title || productData.name}`);
      
      // Create update object with correct field mappings
      const updateData = {};
      
      // Map title to name if needed
      if (productData.title && !productData.name) {
        updateData.name = productData.title;
      }
      
      // Map quantityAvailable to quantity if needed
      if (productData.quantityAvailable && !productData.quantity) {
        updateData.quantity = productData.quantityAvailable;
      }
      
      // Add unit if missing
      if (!productData.unit) {
        updateData.unit = 'kg'; // Default unit
      }
      
      // Add seller if missing (use first user as default)
      if (!productData.seller) {
        updateData.seller = users[0]._id;
      }
      
      // Add sellerType if missing
      if (!productData.sellerType) {
        updateData.sellerType = 'farmer';
      }
      
      // Add location if missing
      if (!productData.location) {
        updateData.location = 'Dhaka, Bangladesh';
      }
      
      // Update images based on product name/title
      let imageName = 'no-photo.jpg'; // default
      const productNameLower = (productData.title || productData.name || '').toLowerCase();
      
      for (let key in imageMap) {
        if (productNameLower.includes(key)) {
          imageName = imageMap[key];
          break;
        }
      }
      
      updateData.images = [imageName];
      
      // Fix category capitalization if needed
      if (productData.category) {
        const categoryMap = {
          'fruits': 'Fruits',
          'vegetables': 'Vegetables', 
          'dairy': 'Dairy',
          'grains': 'Grains',
          'meat': 'Meat',
          'poultry': 'Poultry',
          'seafood': 'Seafood',
          'other': 'Other'
        };
        if (categoryMap[productData.category.toLowerCase()]) {
          updateData.category = categoryMap[productData.category.toLowerCase()];
        }
      }
      
      // Add reviews if product doesn't have any
      if (!productData.ratings || productData.ratings.length === 0) {
        const numReviews = Math.floor(Math.random() * 3) + 2; // 2-4 reviews
        const newRatings = [];
        
        for (let i = 0; i < numReviews; i++) {
          const randomReview = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
          const randomUser = users[Math.floor(Math.random() * users.length)];
          
          newRatings.push({
            rating: randomReview.rating,
            comment: randomReview.comment,
            user: randomUser._id,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
          });
        }
        
        updateData.ratings = newRatings;
        
        // Calculate average rating
        const totalRating = newRatings.reduce((sum, rating) => sum + rating.rating, 0);
        updateData.averageRating = totalRating / newRatings.length;
        updateData.totalReviews = newRatings.length;
        
        console.log(`Added ${numReviews} reviews, average rating: ${updateData.averageRating.toFixed(1)}`);
      }
      
      console.log(`Updated image to: ${imageName}`);
      
      // Update the product using findByIdAndUpdate
      await Product.findByIdAndUpdate(productData._id, updateData, { new: true, runValidators: true });
    }
    
    console.log('\n✅ All products updated successfully!');
    
    // Display updated products
    const updatedProducts = await Product.find({}).select('name images ratings averageRating totalReviews');
    console.log('\nUpdated products:');
    updatedProducts.forEach(product => {
      console.log(`- ${product.name}: ${product.images[0]}, ${product.totalReviews} reviews, avg rating: ${product.averageRating || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateProductsWithImagesAndReviews();