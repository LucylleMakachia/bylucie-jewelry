import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const useWishlist = (getToken, showToast, user) => {
  const [wishlist, setWishlist] = useState([]);
  const [detailedWishlist, setDetailedWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Safe showToast function
  const safeShowToast = useCallback((message, type = 'info') => {
    if (showToast && typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`Toast (${type}):`, message);
    }
  }, [showToast]);

  // Check backend availability
  const checkBackendAvailability = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      setBackendAvailable(res.ok);
      return res.ok;
    } catch (error) {
      console.warn('Backend not available:', error.message);
      setBackendAvailable(false);
      return false;
    }
  }, []);

  // Load wishlist when user changes
  useEffect(() => {
    if (user && backendAvailable) {
      loadWishlist();
    } else {
      setWishlist([]);
      setDetailedWishlist([]);
    }
  }, [user, backendAvailable]);

  // Check backend on mount
  useEffect(() => {
    checkBackendAvailability();
  }, [checkBackendAvailability]);

  // Load wishlist from backend
  const loadWishlist = useCallback(async () => {
    if (!user) return;

    // If backend is not available, don't try to load
    if (!backendAvailable) {
      console.warn('Backend not available, skipping wishlist load');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      console.log('Loading wishlist with token:', token ? 'Present' : 'Missing');
      
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Wishlist response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Wishlist data received:', data);
        
        // Handle both response formats for compatibility
        if (data.items && data.detailedItems) {
          // New format with detailed items
          setWishlist(data.items || []);
          setDetailedWishlist(data.detailedItems || []);
        } else if (data.items) {
          // Old format with just product IDs
          setWishlist(data.items || []);
          setDetailedWishlist([]);
        } else {
          // Fallback
          setWishlist([]);
          setDetailedWishlist([]);
        }
      } else if (res.status === 404) {
        console.warn('Wishlist endpoint not found (404)');
        setWishlist([]);
        setDetailedWishlist([]);
        setBackendAvailable(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load wishlist: ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      setError(error.message);
      setBackendAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [getToken, user, backendAvailable]);

  // Add item to wishlist
  const addToWishlist = useCallback(async (productId) => {
    if (!user) {
      safeShowToast('Please sign in to save items to wishlist', 'warning');
      return false;
    }

    if (!backendAvailable) {
      safeShowToast('Wishlist feature is currently unavailable', 'warning');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update both states with new data
        setWishlist(data.items || []);
        setDetailedWishlist(data.detailedItems || []);
        safeShowToast('✅ Added to wishlist', 'success');
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add to wishlist: ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      setError(error.message);
      safeShowToast('❌ Failed to add to wishlist', 'error');
      setBackendAvailable(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getToken, safeShowToast, user, backendAvailable]);

  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (productId) => {
    if (!user) return false;

    if (!backendAvailable) {
      safeShowToast('Wishlist feature is currently unavailable', 'warning');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (res.ok) {
        // Update both wishlist states
        setWishlist(prev => prev.filter(id => id !== productId));
        setDetailedWishlist(prev => prev.filter(item => item.productId !== productId));
        safeShowToast('Removed from wishlist', 'success');
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to remove from wishlist: ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      setError(error.message);
      safeShowToast('❌ Failed to remove from wishlist', 'error');
      setBackendAvailable(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getToken, safeShowToast, user, backendAvailable]);

  // Toggle wishlist item
  const toggleWishlist = useCallback(async (productId) => {
    if (wishlist.includes(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }, [wishlist, addToWishlist, removeFromWishlist]);

  // Check if item is in wishlist
  const isInWishlist = useCallback((productId) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  return {
    wishlist, // Array of product IDs for quick checking
    detailedWishlist, // Array of detailed product objects for display
    loading,
    error,
    backendAvailable,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: loadWishlist,
    checkBackend: checkBackendAvailability
  };
};