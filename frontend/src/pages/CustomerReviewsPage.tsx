import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Star, Package, Calendar, Edit, Trash2, ThumbsUp, Flag, MessageSquare } from 'lucide-react';
import './CustomerReviewsPage.css';

interface ReviewableProduct {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    category: string;
  };
  order: {
    _id: string;
    orderId: string;
    deliveredAt: string;
  };
  quantity: number;
  unit: string;
  price: number;
}

interface Review {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    category: string;
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

const CustomerReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reviewable' | 'my-reviews'>('reviewable');
  const [reviewableProducts, setReviewableProducts] = useState<ReviewableProduct[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ReviewableProduct | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({
    title: '',
    reviewText: '',
    rating: 5,
    criteria: {
      quality: 5,
      freshness: 5,
      packaging: 5,
      value: 5
    }
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'consumer') {
      if (activeTab === 'reviewable') {
        fetchReviewableProducts();
      } else {
        fetchMyReviews();
      }
    }
  }, [user, activeTab]);

  const fetchReviewableProducts = async () => {
    try {
      setLoading(true);
      const response = await reviewsApi.getReviewableProducts();
      setReviewableProducts(response.data.products);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching reviewable products:', err);
      setError(err.response?.data?.message || 'Failed to fetch reviewable products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsApi.getUserReviews();
      setMyReviews(response.data.reviews);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching my reviews:', err);
      setError(err.response?.data?.message || 'Failed to fetch your reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = (product: ReviewableProduct) => {
    setSelectedProduct(product);
    setEditingReview(null);
    setReviewForm({
      title: '',
      reviewText: '',
      rating: 5,
      criteria: {
        quality: 5,
        freshness: 5,
        packaging: 5,
        value: 5
      }
    });
    setShowReviewModal(true);
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setSelectedProduct(null);
    setReviewForm({
      title: review.title,
      reviewText: review.reviewText,
      rating: review.rating,
      criteria: {
        quality: review.criteria?.quality || 5,
        freshness: review.criteria?.freshness || 5,
        packaging: review.criteria?.packaging || 5,
        value: review.criteria?.value || 5
      }
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    console.log('CustomerReviewsPage: handleSubmitReview called');
    console.log('CustomerReviewsPage: selectedProduct:', selectedProduct);
    console.log('CustomerReviewsPage: editingReview:', editingReview);
    console.log('CustomerReviewsPage: reviewForm:', reviewForm);
    
    if (!selectedProduct && !editingReview) {
      console.log('CustomerReviewsPage: No selected product or editing review');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const reviewData = {
        title: reviewForm.title,
        text: reviewForm.reviewText,
        rating: reviewForm.rating,
        reviewType: 'product' as const,
        reviewTarget: selectedProduct?.product._id || editingReview?.product._id,
        criteria: reviewForm.criteria
      };
      
      console.log('CustomerReviewsPage: About to submit review data:', reviewData);

      if (editingReview) {
        console.log('CustomerReviewsPage: Updating existing review');
        await reviewsApi.updateReview(editingReview._id, reviewData);
      } else {
        console.log('CustomerReviewsPage: Creating new review');
        await reviewsApi.createReview(reviewData);
      }
      
      console.log('CustomerReviewsPage: Review submission successful');

      setShowReviewModal(false);
      setSelectedProduct(null);
      setEditingReview(null);
      
      // Refresh data
      if (activeTab === 'reviewable') {
        fetchReviewableProducts();
      } else {
        fetchMyReviews();
      }
    } catch (err: any) {
      console.error('CustomerReviewsPage: Error submitting review:', err);
      console.log('CustomerReviewsPage: Full error object:', err);
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewsApi.deleteReview(reviewId);
        fetchMyReviews();
      } catch (err: any) {
        console.error('Error deleting review:', err);
        setError('Failed to delete review');
      }
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      await reviewsApi.voteOnReview(reviewId, { voteType: 'helpful' });
      fetchMyReviews();
    } catch (err: any) {
      console.error('Error voting helpful:', err);
      setError('Failed to vote on review');
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange && onChange(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!user || user.role !== 'consumer') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only consumers can access the reviews page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="mt-2 text-gray-600">Manage your product reviews and ratings</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reviewable')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviewable'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products to Review
              </button>
              <button
                onClick={() => setActiveTab('my-reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-reviews'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Reviews
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => activeTab === 'reviewable' ? fetchReviewableProducts() : fetchMyReviews()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'reviewable' ? (
              reviewableProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products to Review</h2>
                  <p className="text-gray-600 mb-6">You don't have any delivered orders with products that can be reviewed.</p>
                  <Link
                    to="/products"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 inline-flex items-center"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Start Shopping
                  </Link>
                </div>
              ) : (
                reviewableProducts.map((item) => (
                  <div key={`${item.product._id}-${item.order._id}`} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={`/uploads/products/${item.product.images[0]}`}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/no-photo.jpg';
                            }}
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">{item.product.category}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Order #{item.order.orderId}</span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Delivered {new Date(item.order.deliveredAt).toLocaleDateString()}
                          </span>
                          <span>{item.quantity} {item.unit}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleWriteReview(item)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Write Review
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              myReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h2>
                  <p className="text-gray-600">You haven't written any reviews yet.</p>
                </div>
              ) : (
                myReviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {review.product.images && review.product.images.length > 0 ? (
                            <img
                              src={`/uploads/products/${review.product.images[0]}`}
                              alt={review.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/no-photo.jpg';
                              }}
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{review.product.name}</h3>
                          <p className="text-sm text-gray-600">{review.product.category}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition duration-200"
                          title="Edit Review"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition duration-200"
                          title="Delete Review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-700">{review.reviewText}</p>
                    </div>

                    {review.criteria && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Detailed Ratings:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(review.criteria).map(([criterion, rating]) => (
                            <div key={criterion} className="text-center">
                              <p className="text-sm text-gray-600 capitalize">{criterion}</p>
                              <div className="flex justify-center mt-1">
                                {renderStars(rating)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleHelpfulVote(review._id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition duration-200"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm">{review.helpfulVotes.length} helpful</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          review.status === 'active' ? 'bg-green-100 text-green-800' :
                          review.status === 'flagged' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {review.response && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Seller Response:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(review.response.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.response.text}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          - {review.response.respondedBy.name}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingReview ? 'Edit Review' : 'Write Review'}
                  </h2>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                {(selectedProduct || editingReview) && (
                  <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {((selectedProduct?.product.images || editingReview?.product.images) && 
                        (selectedProduct?.product.images?.[0] || editingReview?.product.images?.[0])) ? (
                        <img
                          src={`/uploads/products/${selectedProduct?.product.images?.[0] || editingReview?.product.images?.[0]}`}
                          alt={selectedProduct?.product.name || editingReview?.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/no-photo.jpg';
                          }}
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedProduct?.product.name || editingReview?.product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedProduct?.product.category || editingReview?.product.category}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Rating
                    </label>
                    <div className="flex items-center space-x-2">
                      {renderStars(reviewForm.rating, true, (rating) => 
                        setReviewForm(prev => ({ ...prev, rating }))
                      )}
                      <span className="text-sm text-gray-600">({reviewForm.rating}/5)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Title
                    </label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Summarize your experience"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Text
                    </label>
                    <textarea
                      value={reviewForm.reviewText}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, reviewText: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Share your detailed experience with this product"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Detailed Ratings
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(reviewForm.criteria).map(([criterion, rating]) => (
                        <div key={criterion}>
                          <label className="block text-sm text-gray-600 mb-1 capitalize">
                            {criterion}
                          </label>
                          <div className="flex items-center space-x-2">
                            {renderStars(rating, true, (newRating) => 
                              setReviewForm(prev => ({
                                ...prev,
                                criteria: { ...prev.criteria, [criterion]: newRating }
                              }))
                            )}
                            <span className="text-xs text-gray-500">({rating}/5)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting || !reviewForm.title.trim() || !reviewForm.reviewText.trim()}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingReview ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        {editingReview ? 'Update Review' : 'Submit Review'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviewsPage;