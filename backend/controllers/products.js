const Product = require('../models/Product');
const { deleteFile } = require('../middleware/upload');
const { sendProductNotification } = require('./notifications');
const path = require('path');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Product.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Populate seller information
    query = query.populate('seller', 'name email role');

    // Executing query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get products by seller (for farmers/vendors to manage their products)
// @route   GET /api/v1/products/my-products
// @access  Private
exports.getMyProducts = async (req, res, next) => {
  try {
    // Check if user is farmer, vendor, or admin
    if (!['farmer', 'vendor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only farmers, vendors, and admins can view products.'
      });
    }

    let query = {};
    
    // If not admin, only show user's own products
    if (req.user.role !== 'admin') {
      query.seller = req.user.id;
    }

    const products = await Product.find(query)
      .populate('seller', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Upload product images
// @route   PUT /api/v1/products/:id/images
// @access  Private
exports.uploadProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to upload images for this product'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one image'
      });
    }

    // Add new images to existing ones
    const newImageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
    const existingImages = product.images || [];
    const allImages = [...existingImages, ...newImageUrls];

    // Limit to maximum 5 images
    if (allImages.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 images allowed per product'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { images: allImages },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: updatedProduct
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email role');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private
exports.createProduct = async (req, res, next) => {
  try {
    console.log('Received product creation request:');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    // Add user to req.body
    req.body.seller = req.user.id;
    req.body.sellerType = req.user.role;

    // Check if user is farmer, vendor, or admin
    if (!['farmer', 'vendor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only farmers, vendors, and admins can add products'
      });
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
      req.body.images = imageUrls;
    }

    // Validate required fields
    const { name, description, price, category, quantity, unit, location } = req.body;
    if (!name || !description || !price || !category || !quantity || !unit || !location) {
      console.log('Missing required fields:', { name, description, price, category, quantity, unit, location });
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, description, price, category, quantity, unit, location'
      });
    }

    // Validate price and quantity
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity cannot be negative'
      });
    }

    // Clean the request body to only include valid Product schema fields
    const cleanProductData = {
      name,
      description,
      price: parseFloat(price),
      category,
      quantity: parseInt(quantity),
      unit,
      location,
      seller: req.body.seller,
      sellerType: req.body.sellerType,
      isOrganic: req.body.isOrganic === 'true' || req.body.isOrganic === true,
      isSeasonal: req.body.isSeasonal === 'true' || req.body.isSeasonal === true
    };

    if (req.body.images) {
      cleanProductData.images = req.body.images;
    }

    console.log('Clean product data:', cleanProductData);
    const product = await Product.create(cleanProductData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this product'
      });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Add new images to existing ones (don't delete existing images)
      const newImageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
      const existingImages = product.images || [];
      const allImages = [...existingImages, ...newImageUrls];
      
      // Limit to maximum 5 images
      if (allImages.length > 5) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 5 images allowed per product. Please remove some existing images first.'
        });
      }
      
      req.body.images = allImages;
    }

    // Validate price and quantity if provided
    if (req.body.price !== undefined && req.body.price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0'
      });
    }

    if (req.body.quantity !== undefined && req.body.quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity cannot be negative'
      });
    }

    // Check if product is going from out-of-stock to in-stock
    const wasOutOfStock = product.quantity === 0;
    const willBeInStock = req.body.quantity !== undefined && req.body.quantity > 0;
    
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Send back-in-stock notification if applicable
    if (wasOutOfStock && willBeInStock) {
      try {
        await sendProductNotification('product_back_in_stock', product._id, {
          productName: product.name,
          productId: product._id,
          actionUrl: `/products/${product._id}`,
          imageUrl: product.images && product.images.length > 0 ? product.images[0] : null
        });
      } catch (notificationError) {
        console.error('Failed to send back-in-stock notification:', notificationError);
        // Don't fail the product update if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this product'
      });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      product.images.forEach(imageUrl => {
        if (imageUrl !== 'no-photo.jpg') {
          const filename = path.basename(imageUrl);
          deleteFile(filename);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Remove specific image from product
// @route   DELETE /api/v1/products/:id/images/:imageIndex
// @access  Private
exports.removeProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to modify this product'
      });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex < 0 || imageIndex >= product.images.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image index'
      });
    }

    const imageToRemove = product.images[imageIndex];
    
    // Don't delete the no-photo placeholder files
    if (imageToRemove !== '/uploads/products/no-photo.jpg' && imageToRemove !== '/uploads/products/no-photo.svg') {
      const filename = path.basename(imageToRemove);
      deleteFile(filename);
    }

    // Remove image from array
    product.images.splice(imageIndex, 1);
    
    // If no images left, add default
    if (product.images.length === 0) {
      product.images = ['/uploads/products/no-photo.svg'];
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      data: product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Add product review
// @route   POST /api/v1/products/:id/reviews
// @access  Private
exports.addProductReview = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if user has already reviewed
    const alreadyReviewed = product.ratings.find(
      rating => rating.user.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        error: 'Product already reviewed'
      });
    }

    product.ratings.push({
      rating: req.body.rating,
      comment: req.body.comment,
      user: req.user.id
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};