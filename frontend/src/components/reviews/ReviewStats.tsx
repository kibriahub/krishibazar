import React from 'react';
import { Star } from 'lucide-react';
import StarRating from './StarRating';

interface ReviewStatsProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  criteriaAverages?: { [key: string]: number };
  className?: string;
}

const ReviewStats: React.FC<ReviewStatsProps> = ({
  averageRating,
  totalReviews,
  ratingDistribution,
  criteriaAverages,
  className = ''
}) => {
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

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>
      
      {/* Overall Rating */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(averageRating)} readonly size="md" />
          <div className="text-sm text-gray-500 mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        
        {/* Rating Distribution */}
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage = getPercentage(count);
            
            return (
              <div key={rating} className="flex items-center space-x-2 mb-1">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Criteria Averages */}
      {criteriaAverages && Object.keys(criteriaAverages).length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Detailed Ratings</h4>
          <div className="space-y-2">
            {Object.entries(criteriaAverages).map(([key, average]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {getCriteriaLabel(key)}
                </span>
                <div className="flex items-center space-x-2">
                  <StarRating rating={Math.round(average)} readonly size="sm" />
                  <span className="text-sm text-gray-600 w-8">
                    {average.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {totalReviews === 0 && (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No reviews yet</p>
          <p className="text-sm text-gray-400">Be the first to leave a review!</p>
        </div>
      )}
    </div>
  );
};

export default ReviewStats;