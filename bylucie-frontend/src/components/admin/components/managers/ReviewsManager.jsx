import React, { useState } from 'react';
import { FaStar, FaRegStar, FaCheck, FaTimes, FaTrash, FaSearch, FaImage, FaVideo, FaSpinner } from 'react-icons/fa';

function ReviewsManager({ 
  reviewsData, 
  products, 
  getProductName, 
  getProductInfo, 
  onReviewAction, 
  onDeleteReview, 
  onRefresh,
  showConfirmation,
  showToast,
  reviewActionLoading,
  onRefreshProductStats 
}) {
  const { reviews = [], totalReviews = 0, averageRating = 0, pendingReviews = 0, statusCounts: initialStatusCounts = {} } = reviewsData || {};
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [adminResponse, setAdminResponse] = useState('');
  const [selectedReviewForAction, setSelectedReviewForAction] = useState(null);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderStars = (rating) => {
    const numericRating = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return starValue <= numericRating ? (
        <FaStar key={starValue} className="w-4 h-4 text-yellow-400" />
      ) : (
        <FaRegStar key={starValue} className="w-4 h-4 text-gray-300" />
      );
    });
  };

  // Enhanced action handler with admin response
  const handleAction = async (reviewId, action) => {
    if (onReviewAction) {
      // If admin response is available, use it
      const responseText = adminResponse.trim();
      await onReviewAction(reviewId, action, responseText);
      
      // Reset admin response after action
      if (responseText) {
        setAdminResponse('');
      }
    }
  };

  // Action with admin response prompt
  const handleActionWithPrompt = (reviewId, action) => {
    setSelectedReviewForAction({ reviewId, action });
  };

  // Confirm action with admin response
  const confirmAction = () => {
    if (selectedReviewForAction) {
      const { reviewId, action } = selectedReviewForAction;
      handleAction(reviewId, action);
      setSelectedReviewForAction(null);
    }
  };

  // Cancel action
  const cancelAction = () => {
    setSelectedReviewForAction(null);
    setAdminResponse('');
  };

  const handleDelete = async (reviewId) => {
    if (showConfirmation) {
      showConfirmation(
        'Delete Review',
        'Are you sure you want to delete this review? This action cannot be undone and will permanently remove this customer feedback.',
        () => onDeleteReview && onDeleteReview(reviewId),
        'danger'
      );
    } else if (onDeleteReview && window.confirm('Are you sure you want to delete this review?')) {
      await onDeleteReview(reviewId);
    }
  };

  // Safe product name function
  const getSafeProductName = (review) => {
    try {
      if (review.productId && typeof review.productId === 'object' && review.productId.name) {
        return String(review.productId.name).toLowerCase();
      } else if (getProductName) {
        const name = getProductName(review.productId);
        return String(name || '').toLowerCase();
      }
      return '';
    } catch (error) {
      return '';
    }
  };

  // Calculate status counts if not provided
  const getStatusCounts = () => {
    const counts = {
      all: reviews.length,
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    reviews.forEach(review => {
      if (review && review.status) {
        counts[review.status] = (counts[review.status] || 0) + 1;
      }
    });
    return counts;
  };

  // Use provided statusCounts or calculate them
  const statusCounts = Object.keys(initialStatusCounts).length > 0 ? initialStatusCounts : getStatusCounts();

  // Filter and sort reviews
  const filteredReviews = reviews.filter(review => {
    if (!review) return false;
    
    if (filterStatus !== 'all' && review.status !== filterStatus) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const productName = getSafeProductName(review);
      const userName = String(review.userName || '').toLowerCase();
      const userEmail = String(review.userEmail || '').toLowerCase();
      const comment = String(review.comment || '').toLowerCase();
      
      return productName.includes(searchLower) || 
             userName.includes(searchLower) || 
             userEmail.includes(searchLower) ||
             comment.includes(searchLower);
    }
    
    return true;
  }).sort((a, b) => {
    try {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
        case 'oldest':
          return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
        case 'highest-rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'lowest-rating':
          return (a.rating || 0) - (b.rating || 0);
        case 'product-name':
          const productA = getSafeProductName(a);
          const productB = getSafeProductName(b);
          return productA.localeCompare(productB);
        default:
          return 0;
      }
    } catch (error) {
      return 0;
    }
  });

  if (!reviewsData) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#b8860b] mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
      {/* Admin Response Modal */}
      {selectedReviewForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedReviewForAction.action === 'approve' ? 'Approve Review' : 'Reject Review'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedReviewForAction.action === 'approve' 
                ? 'Add an optional admin response (visible to customers):' 
                : 'Add an optional reason for rejection (visible to customers):'}
            </p>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder={selectedReviewForAction.action === 'approve' 
                ? "Thank you for your feedback! We're glad you enjoyed our product..." 
                : "Please provide a reason for rejecting this review..."}
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={reviewActionLoading === selectedReviewForAction.reviewId}
                className="px-4 py-2 bg-[#b8860b] text-white rounded-md hover:bg-[#997500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {reviewActionLoading === selectedReviewForAction.reviewId && (
                  <FaSpinner className="animate-spin" />
                )}
                {selectedReviewForAction.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Summary */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Reviews Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-sm">
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wide">Total Reviews</p>
            <p className="text-4xl font-bold text-blue-900 mt-2">{totalReviews}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-sm">
            <p className="text-green-700 font-semibold text-sm uppercase tracking-wide">Average Rating</p>
            <p className="text-4xl font-bold text-green-900 mt-2">{averageRating ? averageRating.toFixed(1) : '0.0'}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 shadow-sm">
            <p className="text-amber-700 font-semibold text-sm uppercase tracking-wide">Pending Moderation</p>
            <p className="text-4xl font-bold text-amber-900 mt-2">{pendingReviews}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-sm">
            <p className="text-purple-700 font-semibold text-sm uppercase tracking-wide">Approved Reviews</p>
            <p className="text-4xl font-bold text-purple-900 mt-2">{statusCounts.approved || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
          <p className="text-gray-600 text-lg">Manage and moderate customer feedback</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent w-full sm:w-72 text-lg transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent text-lg transition-all"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="approved">Approved ({statusCounts.approved || 0})</option>
            <option value="rejected">Rejected ({statusCounts.rejected || 0})</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent text-lg transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest-rating">Highest Rating</option>
            <option value="lowest-rating">Lowest Rating</option>
            <option value="product-name">Product Name</option>
          </select>

          <button
            onClick={() => {
              onRefresh && onRefresh();
              if (showToast) showToast('🔄 Reviews refreshed successfully!', 'success');
            }}
            className="bg-gradient-to-r from-[#b8860b] to-[#daa520] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#daa520] hover:to-[#b8860b] transition-all transform hover:scale-105 shadow-lg text-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-lg text-gray-600 font-medium">
        Showing {filteredReviews.length} of {reviews.length} reviews
        {searchTerm && ` matching "${searchTerm}"`}
        {filterStatus !== 'all' && ` with status "${filterStatus}"`}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => {
            const productInfo = getProductInfo ? getProductInfo(review.productId) : null;
            const isActionLoading = reviewActionLoading === (review._id || review.id);

            return (
              <div key={review._id || review.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {renderStars(review.rating)}
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          review.status === 'approved' 
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' 
                            : review.status === 'rejected'
                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                            : 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300'
                        }`}>
                          {review.status || 'pending'}
                        </span>
                      </div>
                      <div className="text-lg text-gray-500 font-medium">
                        {formatDate(review.createdAt || review.date)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{review.userName}</p>
                        <p className="text-gray-600 text-lg">{review.userEmail}</p>
                        {review.userId && (
                          <p className="text-gray-500 text-sm mt-2">User ID: {review.userId}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {typeof review.productId === 'object' && review.productId !== null 
                            ? review.productId.name 
                            : getProductName ? getProductName(review.productId) : 'Unknown Product'}
                        </p>
                        {productInfo && (
                          <div className="text-gray-600 text-lg space-y-2">
                            <p>Category: {productInfo.category || 'Uncategorized'}</p>
                            <p>Price: KES {productInfo.price ? productInfo.price.toLocaleString() : '0'}</p>
                            {productInfo.inStock !== undefined && (
                              <p>Stock: {productInfo.inStock ? '✅ In Stock' : '❌ Out of Stock'}</p>
                            )}
                            {/* Product Review Stats */}
                            {productInfo.rating > 0 && (
                              <p>Rating: {productInfo.rating.toFixed(1)}/5 ({productInfo.reviewCount || 0} reviews)</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-800 mt-4 bg-white p-4 rounded-xl border border-gray-200 text-lg leading-relaxed">{review.comment}</p>

                    {/* Admin Response */}
                    {review.adminResponse && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-blue-800 font-semibold text-lg mb-2">Admin Response:</p>
                        <p className="text-blue-700 text-lg">{review.adminResponse}</p>
                      </div>
                    )}

                    {/* Media Attachments */}
                    {review.mediaUrls && review.mediaUrls.length > 0 && (
                      <div className="mt-6">
                        <p className="text-gray-600 text-lg mb-4 flex items-center gap-3 font-medium">
                          <FaImage className="text-gray-400 text-xl" />
                          Attachments ({review.mediaUrls.length})
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {review.mediaUrls.map((media, index) => (
                            <div key={index} className="relative group transform hover:scale-110 transition-transform duration-300">
                              {media.type === 'image' ? (
                                <div className="relative">
                                  <img
                                    src={media.url}
                                    alt={`Review attachment ${index + 1}`}
                                    className="w-24 h-24 object-cover rounded-xl border-2 border-gray-300 cursor-pointer hover:border-[#b8860b] transition-all shadow-lg"
                                    onClick={() => window.open(media.url, '_blank')}
                                  />
                                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-lg">
                                    Image
                                  </div>
                                </div>
                              ) : (
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#b8860b] transition-all shadow-lg group-hover:from-gray-200 group-hover:to-gray-300">
                                  <FaVideo className="text-gray-500 text-2xl mb-2 group-hover:text-gray-700" />
                                  <span className="text-xs text-gray-600 font-medium">Video</span>
                                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-lg">
                                    Video
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => handleActionWithPrompt(review._id || review.id, 'approve')}
                        disabled={isActionLoading}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-3 lg:w-full justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Approve Review"
                      >
                        {isActionLoading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaCheck size={18} />
                        )}
                        <span className="text-lg lg:block hidden font-semibold">
                          {isActionLoading ? 'Processing...' : 'Approve'}
                        </span>
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => handleActionWithPrompt(review._id || review.id, 'reject')}
                        disabled={isActionLoading}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all flex items-center gap-3 lg:w-full justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reject Review"
                      >
                        {isActionLoading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTimes size={18} />
                        )}
                        <span className="text-lg lg:block hidden font-semibold">
                          {isActionLoading ? 'Processing...' : 'Reject'}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review._id || review.id)}
                      disabled={isActionLoading}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all flex items-center gap-3 lg:w-full justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Review"
                    >
                      {isActionLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrash size={16} />
                      )}
                      <span className="text-lg lg:block hidden font-semibold">
                        {isActionLoading ? 'Processing...' : 'Delete'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <FaRegStar className="mx-auto text-6xl text-gray-300 mb-6" />
            <h3 className="text-3xl font-bold text-gray-600 mb-4">No Reviews Found</h3>
            <p className="text-gray-500 text-xl">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Customer reviews will appear here once submitted.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewsManager;