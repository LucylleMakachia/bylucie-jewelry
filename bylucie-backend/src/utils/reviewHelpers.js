// Centralized query for approved reviews
export const getApprovedReviewsQuery = (productId = null) => {
  const query = {
    $or: [
      { status: 'approved' },
      { 
        $and: [
          { status: { $exists: false } },
          { approved: true }
        ]
      }
    ]
  };
  
  if (productId) {
    query.productId = productId;
  }
  
  return query;
};

// Calculate review statistics from reviews array
export const calculateReviewStats = (reviews) => {
  const approvedReviews = reviews.filter(review => 
    review.status === 'approved' || review.approved === true
  );
  
  const stats = {
    averageRating: 0,
    totalReviews: approvedReviews.length,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
  
  if (approvedReviews.length > 0) {
    const totalRating = approvedReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    stats.averageRating = parseFloat((totalRating / approvedReviews.length).toFixed(1));
    
    approvedReviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        stats.ratingDistribution[rating]++;
      }
    });
  }
  
  return stats;
};