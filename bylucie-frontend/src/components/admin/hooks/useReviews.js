import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const useReviews = (getToken, showToast) => {
  const [reviewsData, setReviewsData] = useState({
    totalReviews: 0,
    averageRating: 0,
    pendingReviews: 0,
    statusCounts: { pending: 0, approved: 0, rejected: 0 },
    reviews: []
  });
  const [reviewActionLoading, setReviewActionLoading] = useState(null);

  const fetchReviewsData = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('📝 Reviews data fetched:', data);
        setReviewsData(data);
      } else {
        console.warn('⚠️ Failed to fetch reviews, setting default data');
        setReviewsData({
          totalReviews: 0,
          averageRating: 0,
          pendingReviews: 0,
          statusCounts: { pending: 0, approved: 0, rejected: 0 },
          reviews: []
        });
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      setReviewsData({
        totalReviews: 0,
        averageRating: 0,
        pendingReviews: 0,
        statusCounts: { pending: 0, approved: 0, rejected: 0 },
        reviews: []
      });
      showToast('❌ Failed to fetch reviews data', 'error');
    }
  }, [getToken, showToast]);

  // FIXED: Added adminResponse parameter and proper status handling
  const handleReviewAction = useCallback(async (reviewId, action, adminResponse = '') => {
    try {
      setReviewActionLoading(reviewId);
      const token = await getToken();
      
      const endpoint = `${API_BASE_URL}/api/admin/reviews/${reviewId}/${action}`;
      
      console.log(`🔄 Review action: ${action} for review ${reviewId}`, { adminResponse });
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ adminResponse }) 
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log(`✅ Review ${action}d:`, result);
        
        // FIXED: Better state update with dual field support
        setReviewsData(prev => {
          if (!prev || !prev.reviews) return prev;
          
          const updatedReviews = prev.reviews.map(review => 
            review._id === reviewId 
              ? { 
                  ...review, 
                  status: action === 'approve' ? 'approved' : 'rejected',
                  approved: action === 'approve',
                  approvedAt: action === 'approve' ? new Date().toISOString() : null,
                  adminResponse: adminResponse || review.adminResponse
                }
              : review
          );
          
          // FIXED: Better status counting
          const statusCounts = {
            pending: updatedReviews.filter(r => r.status === 'pending').length,
            approved: updatedReviews.filter(r => r.status === 'approved').length,
            rejected: updatedReviews.filter(r => r.status === 'rejected').length
          };
          
          return {
            ...prev,
            reviews: updatedReviews,
            pendingReviews: statusCounts.pending,
            statusCounts,
            totalReviews: updatedReviews.length
          };
        });

        showToast(`✅ Review ${action}d successfully!`, 'success');
        return result;
      } else {
        const errorText = await res.text();
        console.error(`❌ Failed to ${action} review:`, errorText);
        // Refresh data from server on error
        await fetchReviewsData();
        showToast(`❌ Failed to ${action} review`, 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating review:', error);
      showToast(`❌ Failed to ${action} review: ${error.message}`, 'error');
      return false;
    } finally {
      setReviewActionLoading(null);
    }
  }, [getToken, showToast, fetchReviewsData]);

  const handleDeleteReview = useCallback(async (reviewId) => {
    try {
      setReviewActionLoading(reviewId);
      const token = await getToken();
      
      console.log(`🗑️ Deleting review: ${reviewId}`);
      
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log('✅ Review deleted:', result);
        
        setReviewsData(prev => {
          if (!prev || !prev.reviews) return prev;
          
          const updatedReviews = prev.reviews.filter(review => review._id !== reviewId);
          
          // FIXED: Better status counting
          const statusCounts = {
            pending: updatedReviews.filter(r => r.status === 'pending').length,
            approved: updatedReviews.filter(r => r.status === 'approved').length,
            rejected: updatedReviews.filter(r => r.status === 'rejected').length
          };
          
          return {
            ...prev,
            reviews: updatedReviews,
            pendingReviews: statusCounts.pending,
            statusCounts,
            totalReviews: updatedReviews.length
          };
        });
        
        showToast('🗑️ Review deleted successfully!', 'success');
        return result;
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to delete review:', errorText);
        // Refresh data from server on error
        await fetchReviewsData();
        showToast('❌ Failed to delete review', 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting review:', error);
      showToast('❌ Failed to delete review', 'error');
      return false;
    } finally {
      setReviewActionLoading(null);
    }
  }, [getToken, showToast, fetchReviewsData]);

  return {
    reviewsData,
    reviewActionLoading,
    fetchReviewsData,
    handleReviewAction,
    handleDeleteReview
  };
};