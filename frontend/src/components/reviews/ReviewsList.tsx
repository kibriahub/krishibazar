import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, MessageCircle, Calendar, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product?: {
    _id: string;
    name: string;
  };
  seller?: {
    _id: string;
    name: string;
  };
  event?: {
    _id: string;
    title: string;
  };
  order?: {
    _id: string;
    orderNumber: string;
  };
  overallRating: number;
  criteriaRatings: {
    quality: number;
    value: number;
    service: number;
    delivery?: number;
    packaging?: number;
  };
  comment: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: {
    helpful: number;
    notHelpful: number;
    userVote?: 'helpful' | 'not_helpful';
  };
  sellerResponse?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

interface ReviewsListProps {
  reviews: Review[];
  loading?: boolean;
  onVoteHelpful?: (reviewId: string, vote: 'helpful' | 'not_helpful') => void;
  onFlag?: (reviewId: string, reason: string) => void;
  onSellerResponse?: (reviewId: string, response: string) => void;
  showSellerActions?: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  loading = false,
  onVoteHelpful,
  onFlag,
  onSellerResponse,
  showSellerActions = false
}) => {
  const { user } = useAuth();
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const handleVote = (reviewId: string, vote: 'helpful' | 'not_helpful') => {
    if (onVoteHelpful) {
      onVoteHelpful(reviewId, vote);
    }
  };

  const handleFlag = (reviewId: string) => {
    const reason = prompt('Please provide a reason for flagging this review:');
    if (reason && onFlag) {
      onFlag(reviewId, reason);
    }
  };

  const handleSellerResponse = (reviewId: string) => {
    const response = responseText[reviewId];
    if (response && response.trim() && onSellerResponse) {
      onSellerResponse(reviewId, response.trim());
      setResponseText({ ...responseText, [reviewId]: '' });
      setShowResponseForm(null);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`ml-1 ${size === 'sm' ? 'text-sm' : 'text-base'} text-gray-600`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const isExpanded = expandedReviews.has(review._id);
        const canVote = user && user._id !== review.user._id;
        const canRespond = showSellerActions && user && 
          (user.role === 'farmer' || user.role === 'vendor') && 
          !review.sellerResponse;

        return (
          <div key={review._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {review.user.avatar ? (
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                    {review.isVerifiedPurchase && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Verified Purchase</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {renderStars(review.overallRating, 'md')}
              </div>
            </div>

            {/* Product/Service Info */}
            {(review.product || review.event || review.order) && (
              <div className="mb-3 text-sm text-gray-600">
                {review.product && (
                  <span>Product: <span className="font-medium">{review.product.name}</span></span>
                )}
                {review.event && (
                  <span>Event: <span className="font-medium">{review.event.title}</span></span>
                )}
                {review.order && (
                  <span>Order: <span className="font-medium">#{review.order.orderNumber}</span></span>
                )}
              </div>
            )}

            {/* Criteria Ratings */}
            {isExpanded && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Detailed Ratings</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quality:</span>
                    {renderStars(review.criteriaRatings.quality)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Value:</span>
                    {renderStars(review.criteriaRatings.value)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service:</span>
                    {renderStars(review.criteriaRatings.service)}
                  </div>
                  {review.criteriaRatings.delivery && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivery:</span>
                      {renderStars(review.criteriaRatings.delivery)}
                    </div>
                  )}
                  {review.criteriaRatings.packaging && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Packaging:</span>
                      {renderStars(review.criteriaRatings.packaging)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Content */}
            <div className="mb-4">
              <p className="text-gray-800 leading-relaxed">{review.comment}</p>
              
              {/* Pros and Cons */}
              {isExpanded && (review.pros || review.cons) && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {review.pros && review.pros.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-green-700 mb-1">Pros:</h6>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {review.pros.map((pro, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-1">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons && review.cons.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-red-700 mb-1">Cons:</h6>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {review.cons.map((con, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-500 mr-1">-</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Images */}
              {isExpanded && review.images && review.images.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Photos:</h6>
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seller Response */}
            {review.sellerResponse && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-blue-800">Seller Response</span>
                  <span className="text-xs text-blue-600">
                    {formatDate(review.sellerResponse.respondedAt)}
                  </span>
                </div>
                <p className="text-sm text-blue-700">{review.sellerResponse.message}</p>
              </div>
            )}

            {/* Seller Response Form */}
            {canRespond && showResponseForm === review._id && (
              <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                <h6 className="text-sm font-medium text-gray-900 mb-2">Respond to Review</h6>
                <textarea
                  value={responseText[review._id] || ''}
                  onChange={(e) => setResponseText({ ...responseText, [review._id]: e.target.value })}
                  placeholder="Write your response..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => setShowResponseForm(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSellerResponse(review._id)}
                    disabled={!responseText[review._id]?.trim()}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post Response
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {/* Helpfulness Votes */}
                {canVote && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVote(review._id, 'helpful')}
                      className={`flex items-center space-x-1 text-sm ${
                        review.helpfulVotes.userVote === 'helpful'
                          ? 'text-green-600'
                          : 'text-gray-500 hover:text-green-600'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{review.helpfulVotes.helpful}</span>
                    </button>
                    <button
                      onClick={() => handleVote(review._id, 'not_helpful')}
                      className={`flex items-center space-x-1 text-sm ${
                        review.helpfulVotes.userVote === 'not_helpful'
                          ? 'text-red-600'
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>{review.helpfulVotes.notHelpful}</span>
                    </button>
                  </div>
                )}

                {/* Flag Review */}
                {user && user._id !== review.user._id && (
                  <button
                    onClick={() => handleFlag(review._id)}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Flag</span>
                  </button>
                )}

                {/* Seller Response Button */}
                {canRespond && (
                  <button
                    onClick={() => setShowResponseForm(review._id)}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Respond</span>
                  </button>
                )}
              </div>

              {/* Expand/Collapse */}
              <button
                onClick={() => toggleExpanded(review._id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewsList;