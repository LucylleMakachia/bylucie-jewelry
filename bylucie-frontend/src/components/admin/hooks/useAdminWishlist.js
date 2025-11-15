import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const useAdminWishlist = (getToken, showToast) => {
  const [wishlistData, setWishlistData] = useState({
    totalItems: 0,
    uniqueUsers: 0,
    popularItems: [],
    items: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWishlistData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setWishlistData({
          totalItems: data.totalItems || 0,
          uniqueUsers: data.totalUsers || 0, // Map totalUsers to uniqueUsers
          popularItems: data.popularItems || [],
          items: data.items || []
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist data:', error);
      setError(error.message);
      showToast('❌ Failed to fetch wishlist data', 'error');
      
      // Reset to empty state
      setWishlistData({
        totalItems: 0,
        uniqueUsers: 0,
        popularItems: [],
        items: []
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast]);

  return {
    wishlistData,
    fetchWishlistData,
    loading,
    error
  };
};