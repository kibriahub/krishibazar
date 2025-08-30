import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Star, ThumbsUp, ThumbsDown, Flag, MessageSquare, Filter, Search } from 'lucide-react';
import { reviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Review {
  _id: string;
  title: string;
  text: string;
  rating: number;
  reviewType: 'product' | 'seller' | 'event' | 'order';
  targetId: string;
  user: {
    _id: string;
    name: string;
  };
  criteria?: {
    quality?: number;
    freshness?: number;
    packaging?: number;
    valueForMoney?: number;
    communication?: number;
    reliability?: number;
    deliveryTime?: number;
    organization?: number;
    content?: number;
    venue?: number;
  };
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  helpfulVotes: {
    helpful: number;
    notHelpful: number;
  };
  userVote?: 'helpful' | 'not_helpful';
  response?: {
    text: string;
    respondedBy: string;
    respondedAt: Date;
  };
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  criteriaAverages?: { [key: string]: number };
}

const ReviewsPage: React.FC = () => {
  const { reviewType, targetId } = useParams<{ reviewType: string; targetId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'>('newest');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reviewsPerPage = 10;

  useEffect(() => {
    fetchReviews();
  }, [reviewType, targetId, ratingFilter, sortBy, currentPage, searchTerm]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        rating: ratingFilter || undefined,
        page: currentPage,
        limit: reviewsPerPage,
        sort: sortBy,
        search: searchTerm || undefined
      };
      
      let response;
      if (reviewType && targetId) {
        response = await reviewsApi.getTargetReviews(reviewType, targetId, params);
      } else {
        response = await reviewsApi.getReviews(params);
      }
      
      setReviews(response.data.reviews);
      setStats(response.data.stats);
      setTotalPages(Math.ceil(response.data.total / reviewsPerPage));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    if (!user) return;
    
    try {
      await reviewsApi.voteOnReview(reviewId, { voteType });
      fetchReviews(); // Refresh to get updated vote counts
    } catch (err: any) {
      console.error('Failed to vote on review:', err);
    }
  };

  const handleFlag = async (reviewId: string, reason: string, description?: string) => {
    if (!user) return;
    
    try {
      await reviewsApi.flagReview(reviewId, { reason, description });
      alert('Review flagged successfully');
    } catch (err: any) {
      console.error('Failed to flag review:', err);
      alert('Failed to flag review');
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md', showValue: boolean = false) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    
    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${sizeClasses[size]} ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        {showValue && <span className="text-gray-500">({rating})</span>}
      </div>
    );
  };

  const renderCriteria = (criteria: any) => {
    if (!criteria) return null;
    
    const criteriaLabels: { [key: string]: string } = {
      quality: 'Quality',
      freshness: 'Freshness',
      packaging: 'Packaging',
      valueForMoney: 'Value for Money',
      communication: 'Communication',
      reliability: 'Reliability',
      deliveryTime: 'Delivery Time',
      organization: 'Organization',
      content: 'Content',
      venue: 'Venue'
    };
    
    return (
      <div className="mt-3 space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Detailed Ratings:</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(criteria).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{criteriaLabels[key]}:</span>
              {renderStars(value as number, 'sm', true)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReviewCard = (review: Review) => (
    <div key={review._id} className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-semibold">
              {review.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{review.user.name}</h3>
            <p className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {renderStars(review.rating)}
          <span className="text-gray-600">({review.rating})</span>
        </div>
      </div>
      
      <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
      <p className="text-gray-700 mb-4">{review.text}</p>
      
      {renderCriteria(review.criteria)}
      
      {review.images && review.images.length > 0 && (
        <div className="mt-4">
          <div className="flex space-x-2 overflow-x-auto">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}
      
      {review.response && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Response from Seller</span>
          </div>
          <p className="text-gray-700">{review.response.text}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(review.response.respondedAt).toLocaleDateString()}
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleVote(review._id, 'helpful')}
            className={`flex items-center space-x-1 text-sm ${
              review.userVote === 'helpful' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
            }`}
            disabled={!user}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful ({review.helpfulVotes.helpful})</span>
          </button>
          
          <button
            onClick={() => handleVote(review._id, 'not_helpful')}
            className={`flex items-center space-x-1 text-sm ${
              review.userVote === 'not_helpful' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
            }`}
            disabled={!user}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>Not Helpful ({review.helpfulVotes.notHelpful})</span>
          </button>
        </div>
        
        {user && (
          <button
            onClick={() => {
              const reason = prompt('Why are you flagging this review?');
              if (reason) handleFlag(review._id, reason);
            }}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600"
          >
            <Flag className="w-4 h-4" />
            <span>Flag</span>
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchReviews}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {reviewType && targetId ? `Reviews` : 'All Reviews'}
          </h1>
          
          {stats && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.averageRating.toFixed(1)}</div>
                  <div className="flex justify-center mt-1">{renderStars(Math.round(stats.averageRating))}</div>
                  <div className="text-sm text-gray-500 mt-1">{stats.totalReviews} reviews</div>
                </div>
                
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <span className="text-sm w-8">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${((stats.ratingDistribution[rating] || 0) / stats.totalReviews) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">
                        {stats.ratingDistribution[rating] || 0}
                      </span>
                    </div>
                  ))}
                </div>
                
                {stats.criteriaAverages && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Average Criteria Ratings:</h4>
                    {Object.entries(stats.criteriaAverages).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(value, 'sm')}
                          <span className="text-gray-500">({value.toFixed(1)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={ratingFilter || ''}
                  onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="rating_high">Highest Rating</option>
                  <option value="rating_low">Lowest Rating</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No reviews found.</p>
            </div>
          ) : (
            reviews.map(renderReviewCard)
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-green-600 text-white border-green-600'
                      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;