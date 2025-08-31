import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi, reviewsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Minus, Star } from 'lucide-react';
import ReviewStats from '../components/reviews/ReviewStats';
import ReviewCard from '../components/reviews/ReviewCard';
import ReviewForm from '../components/reviews/ReviewForm';

// Define Product interface
interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  title: string;
  reviewText: string;
  rating: number;
  criteria?: { [key: string]: number };
  images?: string[];
  createdAt: string;
  updatedAt: string;
  helpfulVotes: string[];
  flags: Array<{
    user: string;
    reason: string;
    createdAt: string;
  }>;
  response?: {
    text: string;
    respondedBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
  };
  status: 'active' | 'flagged' | 'hidden';
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  seller?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  sellerType: string;
  location: string;
  category: string;
  isOrganic: boolean;
  isSeasonal: boolean;
  quantity: number;
  harvestDate?: string;
  expiryDate?: string;
  averageRating?: number;
  reviews: Review[];
  images?: string[];
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem, getItemQuantity, updateQuantity, removeItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Fetch product details from API
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await productsApi.getProductById(id);
        setProduct(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // Fetch reviews when reviews tab is active
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id || activeTab !== 'reviews') return;
      
      try {
        setReviewsLoading(true);
        console.log('=== REVIEWS DEBUG START ===');
        console.log('Product ID:', id);
        console.log('Active Tab:', activeTab);
        console.log('Calling reviewsApi.getTargetReviews with:', 'product', id);
        
        const response = await reviewsApi.getTargetReviews('product', id);
        
        console.log('=== API RESPONSE DEBUG ===');
        console.log('Full response object:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        console.log('response.data:', response?.data);
        console.log('response.stats:', response?.stats);
        console.log('response.success:', response?.success);
        
        if (response && response.success) {
          console.log('Setting reviews to:', response.data);
          console.log('Reviews array length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
          setReviews(response.data || []);
          console.log('Successfully set reviews:', response.data?.length || 0, 'reviews');
        } else {
          console.log('No data in response or success false, setting empty array');
          setReviews([]);
        }
        
        if (response && response.stats) {
          console.log('Setting stats to:', response.stats);
          setReviewStats(response.stats);
          console.log('Successfully set stats:', response.stats);
        } else {
          console.log('No stats in response');
          setReviewStats(null);
        }
        
        console.log('=== REVIEWS DEBUG END ===');
      } catch (err: any) {
        console.error('=== ERROR FETCHING REVIEWS ===');
        console.error('Error object:', err);
        console.error('Error message:', err?.message);
        console.error('Error response:', err?.response);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id, activeTab]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    // Always refresh reviews after submission
    if (id) {
      reviewsApi.getTargetReviews('product', id).then(response => {
        console.log('handleReviewSuccess called with:', response);
        if (response && response.success) {
          setReviews(response.data || []);
          setReviewStats(response.stats || {});
          console.log('Updated reviews after new review:', response.data?.length || 0);
        }
      });
    }
  };

  const handleReviewUpdate = () => {
    // Always refresh reviews after update
    if (id) {
      reviewsApi.getTargetReviews('product', id).then(response => {
        console.log('handleReviewUpdate called with:', response);
        if (response && response.success) {
          setReviews(response.data || []);
          setReviewStats(response.stats || {});
          console.log('Updated reviews after review update:', response.data?.length || 0);
        }
      });
    }
  };

  const handleReviewDelete = () => {
    handleReviewUpdate();
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) return;
    
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.quantity) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: quantity,
      maxQuantity: product.quantity,
      images: product.images,
      seller: { name: product.seller?.name || 'Unknown' },
      sellerType: product.sellerType
    };
    
    addItem(cartItem);
    
    // Brief loading state for better UX
    setTimeout(() => {
      setIsAdding(false);
      // Reset quantity to 1 after adding
      setQuantity(1);
    }, 500);
  };
  
  const cartQuantity = product ? getItemQuantity(product._id) : 0;
  
  const handleCartQuantityChange = (newQuantity: number) => {
    if (!product) return;
    
    if (newQuantity <= 0) {
      removeItem(product._id);
    } else {
      updateQuantity(product._id, Math.min(newQuantity, product.quantity));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Link to="/products" className="text-green-600 hover:underline mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Product not found</p>
        <Link to="/products" className="text-green-600 hover:underline mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Product Images */}
          <div className="md:w-1/2 p-4">
            <div className="mb-4 h-80 bg-gray-200 rounded-lg flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={`http://localhost:5000${product.images[activeImageIndex]}`} 
                  alt={product.name} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/no-photo.jpg';
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-2">🍅</div>
                  <p>No Image Available</p>
                </div>
              )}
            </div>
            {product.images && product.images.length > 0 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center ${index === activeImageIndex ? 'ring-2 ring-green-500' : ''}`}
                  >
                    <img 
                      src={`http://localhost:5000${image}`} 
                      alt={`Thumbnail ${index + 1}`} 
                      className="h-full w-full object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/no-photo.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
              {product.averageRating && (
                <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="text-green-800">{product.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-4">
              {product.isOrganic && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Organic</span>
              )}
              {product.isSeasonal && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Seasonal</span>
              )}
              <span className="text-gray-500 text-sm">{product.category}</span>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Sold by:</span> {product.seller?.name || 'Unknown Seller'}
              </p>
            </div>

            <div className="text-2xl font-bold text-green-600 mb-4">
              ৳{product.price}/{product.unit}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Seller Type: {product.sellerType === 'farmer' ? 'Farmer' : 'Vendor'}</span>
                <span>Location: {product.location}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Available: {product.quantity} {product.unit}</span>
                {product.harvestDate && <span>Harvest Date: {new Date(product.harvestDate).toLocaleDateString()}</span>}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity ({product.unit})</label>
              <div className="flex items-center">
                <button
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="bg-gray-200 px-3 py-1 rounded-l-md hover:bg-gray-300"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={product.quantity}
                  className="w-16 text-center border-t border-b border-gray-300 py-1"
                />
                <button
                  onClick={() => quantity < product.quantity && setQuantity(quantity + 1)}
                  className="bg-gray-200 px-3 py-1 rounded-r-md hover:bg-gray-300"
                >
                  +
                </button>
                <span className="ml-4 text-gray-600">
                  Total: <span className="font-semibold">৳{product.price * quantity}</span>
                </span>
              </div>
            </div>

            {/* Cart Status and Controls */}
            {cartQuantity > 0 && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">
                    {cartQuantity} {product.unit} in cart
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCartQuantityChange(cartQuantity - 1)}
                      className="w-8 h-8 rounded-full bg-white border border-green-300 flex items-center justify-center hover:bg-green-100 transition duration-200"
                    >
                      <Minus className="h-4 w-4 text-green-600" />
                    </button>
                    <span className="w-8 text-center font-semibold text-green-800">{cartQuantity}</span>
                    <button
                      onClick={() => handleCartQuantityChange(cartQuantity + 1)}
                      disabled={cartQuantity >= product.quantity}
                      className="w-8 h-8 rounded-full bg-white border border-green-300 flex items-center justify-center hover:bg-green-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={isAdding || product.quantity === 0}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isAdding ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {cartQuantity > 0 ? 'Add More to Cart' : 'Add to Cart'}
                  </>
                )}
              </button>
              <Link
                to="/cart"
                className="bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-300 flex items-center justify-center"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'description' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'reviews' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Reviews ({reviewStats?.totalReviews || 0})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'description' ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Product Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading reviews...</p>
                  </div>
                ) : (
                  <>
                    {/* Review Stats */}
                    {reviewStats && (
                      <ReviewStats
                        averageRating={reviewStats.averageRating || 0}
                        totalReviews={reviewStats.totalReviews || 0}
                        ratingDistribution={reviewStats.ratingDistribution || {}}
                        criteriaAverages={reviewStats.criteriaAverages}
                      />
                    )}

                    {/* Write Review Button */}
                    {user && !showReviewForm && (
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Customer Reviews</h3>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
                        >
                          <Star className="w-4 h-4" />
                          <span>Write a Review</span>
                        </button>
                      </div>
                    )}

                    {/* Review Form */}
                    {showReviewForm && (
                      <ReviewForm
                        reviewType="product"
                        targetId={product._id}
                        targetName={product.name}
                        onSuccess={handleReviewSuccess}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {(Array.isArray(reviews) && reviews.length > 0) ? (
                        reviews.map((review) => (
                          <ReviewCard
                            key={review._id}
                            review={review}
                            onUpdate={handleReviewUpdate}
                            onDelete={handleReviewDelete}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No reviews yet</p>
                          <p className="text-sm text-gray-400">Be the first to review this product!</p>
                          {user && !showReviewForm && (
                            <button
                              onClick={() => setShowReviewForm(true)}
                              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                            >
                              Write the First Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;