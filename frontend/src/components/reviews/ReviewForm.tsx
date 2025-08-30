import React, { useState } from 'react';
import { reviewsApi } from '../../services/api';
import { Star, Upload, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ReviewFormProps {
  reviewType: 'product' | 'seller' | 'event' | 'order';
  targetId: string;
  targetName: string;
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  reviewType,
  targetId,
  targetName,
  orderId,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    reviewText: '',
    rating: 0,
    images: [] as string[]
  });
  const [criteria, setCriteria] = useState<{ [key: string]: number }>({
    quality: 0,
    freshness: 0,
    packaging: 0,
    valueForMoney: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleRatingChange = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const handleCriteriaChange = (criterion: string, rating: number) => {
    setCriteria({ ...criteria, [criterion]: rating });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    setImageFiles([...imageFiles, ...files]);
    
    // Convert to base64 for preview (in real app, you'd upload to cloud storage)
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }
    
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!formData.title.trim() || !formData.reviewText.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const reviewData = {
        ...formData,
        reviewType,
        targetId,
        orderId,
        criteria: reviewType === 'product' ? criteria : undefined
      };
      
      await reviewsApi.createReview(reviewData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, onRatingChange: (rating: number) => void, size = 'w-6 h-6') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`${size} transition-colors ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    );
  };

  const getCriteriaForType = () => {
    switch (reviewType) {
      case 'product':
        return [
          { key: 'quality', label: 'Quality' },
          { key: 'freshness', label: 'Freshness' },
          { key: 'packaging', label: 'Packaging' },
          { key: 'valueForMoney', label: 'Value for Money' }
        ];
      case 'seller':
        return [
          { key: 'communication', label: 'Communication' },
          { key: 'reliability', label: 'Reliability' },
          { key: 'deliveryTime', label: 'Delivery Time' },
          { key: 'productQuality', label: 'Product Quality' }
        ];
      case 'event':
        return [
          { key: 'organization', label: 'Organization' },
          { key: 'content', label: 'Content' },
          { key: 'venue', label: 'Venue' },
          { key: 'valueForMoney', label: 'Value for Money' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Write a Review for {targetName}
        </h2>
        <p className="text-gray-600">
          Share your experience to help other customers
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-2">
            {renderStars(formData.rating, handleRatingChange)}
            <span className="text-sm text-gray-600 ml-2">
              {formData.rating > 0 ? `${formData.rating}/5` : 'Select rating'}
            </span>
          </div>
        </div>

        {/* Specific Criteria */}
        {getCriteriaForType().length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rate Specific Aspects
            </label>
            <div className="space-y-3">
              {getCriteriaForType().map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex items-center space-x-2">
                    {renderStars(
                      criteria[key] || 0,
                      (rating) => handleCriteriaChange(key, rating),
                      'w-4 h-4'
                    )}
                    <span className="text-xs text-gray-500 w-8">
                      {criteria[key] || 0}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Summarize your experience"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={100}
            required
          />
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={formData.reviewText}
            onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
            placeholder="Tell others about your experience..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={1000}
            required
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {formData.reviewText.length}/1000 characters
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos (Optional)
          </label>
          <div className="space-y-3">
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {formData.images.length < 5 && (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload images (max 5)
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPG, PNG up to 5MB each
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || formData.rating === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;