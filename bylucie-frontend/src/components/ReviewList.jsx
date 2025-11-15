import React from 'react';
import { FaStar, FaRegStar, FaUserCircle } from 'react-icons/fa';

const ReviewItem = ({ review }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const renderStars = (rating, reviewId) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      // Use a unique key that includes both review ID and star value
      const uniqueKey = `review-${reviewId}-star-${starValue}`;
      return starValue <= rating ? (
        <FaStar key={uniqueKey} className="w-4 h-4 text-yellow-400" />
      ) : (
        <FaRegStar key={uniqueKey} className="w-4 h-4 text-gray-300" />
      );
    });
  };

  // Safe fallbacks for review data
  const userName = review.userName || 'Anonymous';
  const userImage = review.userImage;
  const rating = review.rating || 0;
  const comment = review.comment || 'No comment provided.';
  const createdAt = review.createdAt || review.date || new Date().toISOString();
  const helpfulVotes = review.helpfulVotes || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                // Fixed: Remove optional chaining with assignment
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'block';
                }
              }}
            />
          ) : (
            <FaUserCircle className="w-10 h-10 text-gray-400" />
          )}
          <div>
            <h4 className="font-semibold text-gray-900">{userName}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center space-x-1">
                {/* Pass review ID to ensure unique keys across all reviews */}
                {renderStars(rating, review._id || review.id)}
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 leading-relaxed">{comment}</p>

      {/* Helpful Votes (Optional) */}
      {helpfulVotes !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="text-sm text-gray-600 hover:text-[#b8860b] transition-colors">
            Helpful ({helpfulVotes})
          </button>
        </div>
      )}
    </div>
  );
};

export default function ReviewList({ reviews, averageRating, totalReviews }) {
  // Safe calculation of average rating from reviews if not provided
  const calculatedAverageRating = averageRating !== undefined 
    ? averageRating 
    : reviews && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
      : 0;

  // Safe total reviews count
  const calculatedTotalReviews = totalReviews !== undefined 
    ? totalReviews 
    : reviews ? reviews.length : 0;

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <FaRegStar className="mx-auto text-4xl text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">Be the first to review this product!</p>
      </div>
    );
  }

  const renderAverageStars = (avgRating) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const avgRatingNum = parseFloat(avgRating) || 0;
      
      if (starValue <= Math.floor(avgRatingNum)) {
        return <FaStar key={`avg-star-filled-${starValue}`} className="w-5 h-5 text-yellow-400" />;
      } else if (starValue === Math.ceil(avgRatingNum) && avgRatingNum % 1 !== 0) {
        return (
          <div key={`avg-star-partial-${starValue}`} className="relative">
            <FaRegStar className="w-5 h-5 text-gray-300" />
            <div 
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${(avgRatingNum % 1) * 100}%` }}
            >
              <FaStar className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        return <FaRegStar key={`avg-star-empty-${starValue}`} className="w-5 h-5 text-gray-300" />;
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Customer Reviews
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-[#b8860b]">
                  {calculatedAverageRating.toFixed(1)}
                </span>
                <div className="flex items-center space-x-1">
                  {renderAverageStars(calculatedAverageRating)}
                </div>
              </div>
              <span className="text-gray-600">
                {calculatedTotalReviews} review{calculatedTotalReviews !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List - Added reliable fallback key */}
      <div className="space-y-6">
        {reviews.map((review, index) => (
          <ReviewItem
            key={review._id || review.id || `review-${index}-${Date.now()}`}
            review={review}
          />
        ))}
      </div>
    </div>
  );
}