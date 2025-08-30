import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, reviewsApi } from '../services/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
  seller: {
    name: string;
  };
  averageRating?: number;
  totalReviews: number;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
  };
  createdAt: string;
}

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await productsApi.getProducts({ limit: 4 });
        setFeaturedProducts(response.data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        // Get recent reviews from products
        const productsResponse = await productsApi.getProducts({ limit: 10 });
        const allProducts = productsResponse.data || [];
        
        // Extract reviews from products
        const allReviews: Review[] = [];
        allProducts.forEach((product: any) => {
          if (product.ratings && product.ratings.length > 0) {
            product.ratings.forEach((rating: any) => {
              allReviews.push({
                _id: rating._id || `${product._id}-${Math.random()}`,
                rating: rating.rating,
                comment: rating.comment,
                user: rating.user || { name: 'Anonymous' },
                createdAt: rating.createdAt
              });
            });
          }
        });
        
        // Sort by date and take the 3 most recent
        const sortedReviews = allReviews
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        
        setReviews(sortedReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchFeaturedProducts();
    fetchReviews();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-green-600 text-white py-16 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to KrishiBazar</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Connecting farmers directly with consumers for fresher produce and fair prices.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/products" className="bg-white text-green-600 hover:bg-green-100 px-6 py-3 rounded-md font-medium transition duration-300">
              Browse Products
            </Link>
            <Link to="/register" className="bg-green-700 text-white hover:bg-green-800 px-6 py-3 rounded-md font-medium transition duration-300">
              Join as Farmer/Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeleton
              [1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Link 
                  key={product._id} 
                  to={`/products/${product._id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 block"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {product.images && product.images[0] && product.images[0] !== 'no-photo.jpg' ? (
                      <img 
                        src={`/images/${product.images[0]}`} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 truncate">{product.name}</h3>
                    <p className="text-gray-600 mb-2 text-sm truncate">
                      Seller: {product.seller?.name || 'Unknown'}
                    </p>
                    {product.averageRating && product.totalReviews > 0 && (
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.averageRating!) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-1">
                          ({product.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-600">
                        ৳{product.price}/{product.unit}
                      </span>
                      <button 
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition duration-300"
                        onClick={(e) => {
                          e.preventDefault();
                          // Add to cart functionality would go here
                          console.log('Add to cart:', product._id);
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // No products found
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No featured products available at the moment.</p>
              </div>
            )}
          </div>
          <div className="text-center mt-8">
            <Link to="/products" className="text-green-600 hover:text-green-800 font-medium">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-12 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Register</h3>
              <p className="text-gray-600">Sign up as a consumer, farmer, or vendor to get started.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Order</h3>
              <p className="text-gray-600">Browse fresh products and place your order directly from farmers.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive & Enjoy</h3>
              <p className="text-gray-600">Get your fresh produce delivered and enjoy farm-fresh quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewsLoading ? (
              // Loading skeleton for reviews
              [1, 2, 3].map((item) => (
                <div key={item} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-4/6"></div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-1 w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">"{review.comment}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{review.user?.name || 'Anonymous User'}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback to default testimonials if no reviews
              <>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">"KrishiBazar has transformed how I sell my produce. I now get fair prices and connect directly with my customers."</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">R</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Rahim Khan</h4>
                      <p className="text-sm text-gray-500">Farmer, Rajshahi</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">"I love getting fresh vegetables directly from farmers. The quality is amazing and prices are reasonable."</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">N</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Nusrat Ahmed</h4>
                      <p className="text-sm text-gray-500">Consumer, Dhaka</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(4)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">"As a vendor, KrishiBazar has helped me source the freshest ingredients for my restaurant directly from farmers."</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">K</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Kamal Hossain</h4>
                      <p className="text-sm text-gray-500">Restaurant Owner, Chittagong</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;