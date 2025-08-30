import React, { useState } from 'react';
import { reviewsApi } from '../../services/api';
import { Star, ThumbsUp, Flag, MessageCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

interface ReviewCardProps {
  review: Review;
  onUpdate?: () => void;
  onDelete?: () => void;
  canModerate?: boolean;
  canRespond?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onUpdate,
  onDelete,
  canModerate = false,
  canRespond = false
}) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = user?._id === review.user._id;
  const hasVoted = user && review.helpfulVotes.includes(user._id);
  const isFlagged = review.flags.length > 0;

  const handleVote = async () => {
    if (!user) return;
    
    try {
      await reviewsApi.voteOnReview(review._id, { voteType: 'helpful' });
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Failed to vote on review:', err);
    }
  };

  const handleFlag = async () => {
    if (!user || !flagReason.trim()) return;
    
    try {
      setLoading(true);
      await reviewsApi.flagReview(review._id, { reason: flagReason });
      setShowFlagModal(false);
      setFlagReason('');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to flag review');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    if (!responseText.trim()) return;
    
    try {
      setLoading(true);
      await reviewsApi.addResponse(review._id, { response: responseText });
      setShowResponse(false);
      setResponseText('');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add response');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await reviewsApi.deleteReview(review._id);
      if (onDelete) onDelete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCriteriaLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      quality: 'Quality',
      freshness: 'Freshness',
      packaging: 'Packaging',
      valueForMoney: 'Value for Money',
      communication: 'Communication',
      reliability: 'Reliability',
      deliveryTime: 'Delivery Time',
      productQuality: 'Product Quality',
      organization: 'Organization',
      content: 'Content',
      venue: 'Venue'
    };
    return labels[key] || key;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {review.user.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {review.user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{review.user.name}</h4>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {renderStars(review.rating)}
          <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
          
          {(isOwner || canModerate) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  {isOwner && (
                    <>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Review
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Review
                      </button>
                    </>
                  )}
                  {canModerate && (
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Moderate Review
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
        <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
      </div>

      {/* Criteria Ratings */}
      {review.criteria && Object.keys(review.criteria).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Detailed Ratings</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(review.criteria).map(([key, rating]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{getCriteriaLabel(key)}</span>
                <div className="flex items-center space-x-1">
                  {renderStars(rating, 'w-3 h-3')}
                  <span className="text-xs text-gray-500">{rating}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* Response */}
      {review.response && (
        <div className="mb-4 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Response from {review.response.respondedBy.name}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(review.response.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.response.text}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleVote}
            disabled={!user}
            className={`flex items-center space-x-1 text-sm ${
              hasVoted
                ? 'text-green-600'
                : 'text-gray-500 hover:text-green-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful ({review.helpfulVotes.length})</span>
          </button>
          
          {user && !isOwner && (
            <button
              onClick={() => setShowFlagModal(true)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600"
            >
              <Flag className="w-4 h-4" />
              <span>Flag</span>
            </button>
          )}
        </div>
        
        {canRespond && !review.response && (
          <button
            onClick={() => setShowResponse(true)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Respond
          </button>
        )}
      </div>

      {/* Response Form */}
      {showResponse && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setShowResponse(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleResponse}
              disabled={loading || !responseText.trim()}
              className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Response'}
            </button>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Flag Review</h3>
            <p className="text-gray-600 mb-4">
              Please select a reason for flagging this review:
            </p>
            <select
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
            >
              <option value="">Select a reason</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="fake">Fake review</option>
              <option value="offensive">Offensive language</option>
              <option value="other">Other</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={loading || !flagReason}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Flagging...' : 'Flag Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;