import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
  showValue = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={readonly}
            className={`${sizeClasses[size]} transition-colors ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } ${
              !readonly && star > rating ? 'hover:text-yellow-300' : ''
            }`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-2">
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </span>
      )}
    </div>
  );
};

export default StarRating;