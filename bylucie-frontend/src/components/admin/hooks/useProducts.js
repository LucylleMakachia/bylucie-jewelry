import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const transformImages = (images) => {
  if (!images) return [];
  
  console.log('🔄 Transforming images:', images);
  
  // If it's a single base64 string or URL
  if (typeof images === 'string') {
    return [{ url: images, public_id: null }];
  }
  
  // If it's already an array, ensure each item has the correct structure
  if (Array.isArray(images)) {
    return images.map(img => {
      // If it's already in the correct format, return as-is
      if (img && typeof img === 'object' && img.url) {
        return img;
      }
      // If it's a string in the array, convert to object
      if (typeof img === 'string') {
        return { url: img, public_id: null };
      }
      // If it's an invalid object, return minimal valid object
      return { url: '', public_id: null };
    }).filter(img => img.url !== '');
  }
  
  console.log('❌ Invalid images input, returning empty array');
  return [];
};

export const useProducts = (getToken, showToast) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      const productsArray = Array.isArray(data) ? data : data.products || data.items || data.data || [];
      setProducts(productsArray);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // NEW: Function to refresh product review statistics
  const refreshProductReviews = async (productId) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/refresh-reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to refresh product reviews');
      
      // Refresh products list to get updated stats
      await fetchProducts();
      
      const result = await response.json();
      console.log('✅ Product review stats refreshed:', result);
      
      return result;
    } catch (error) {
      showToast('❌ Failed to refresh product review statistics', 'error');
      throw error;
    }
  };

  const handleProductOperation = async (product, method, urlSuffix = '') => {
    try {
      setModalLoading(true);
      const token = await getToken();
      const productId = product._id || product.id;
      
      // FIXED: Proper image transformation for backend schema
      const transformedProduct = {
        ...product,
        price: Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        discountPercentage: Number(product.discountPercentage) || 0,
        images: transformImages(product.images),
        // NEW: Initialize review statistics for new products
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        status: product.status || 'active'
      };

      // FIXED: Correct admin endpoints
      const baseUrl = `${API_BASE_URL}/api/admin/products`;
      const url = urlSuffix ? `${baseUrl}/${productId}` : baseUrl;
      
      console.log('📦 Product operation:', { method, url, transformedProduct });
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: method !== 'DELETE' ? JSON.stringify(transformedProduct) : undefined,
      });
      
      if (!res.ok) {
        let errorDetail = `HTTP error! status: ${res.status}`;
        try {
          const errorData = await res.json();
          errorDetail = errorData.error || errorData.message || JSON.stringify(errorData);
        } catch {}
        throw new Error(errorDetail);
      }
      
      if (method === 'POST') {
        const result = await res.json();
        if (result.product) setProducts(prev => [result.product, ...prev]);
        showToast('🎉 Product added successfully!', 'success');
        return result;
      } else if (method === 'PUT') {
        const result = await res.json();
        if (result.product) setProducts(prev => prev.map(p => 
          (p._id === productId || p.id === productId) ? result.product : p
        ));
        showToast('✏️ Product updated successfully!', 'success');
      } else if (method === 'DELETE') {
        setProducts(prev => prev.filter(p => p._id !== productId && p.id !== productId));
        showToast('🗑️ Product deleted successfully!', 'success');
      }
      
      // Trigger products update event
      window.dispatchEvent(new Event('productsUpdated'));
      
    } catch (err) {
      const errorMessage = err.name === 'AbortError' 
        ? 'Backend server is not responding.'
        : `Error with product operation: ${err.message}`;
      showToast(`❌ ${errorMessage}`, 'error');
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddProduct = (product) => handleProductOperation(product, 'POST');
  const handleEditProduct = (product) => handleProductOperation(product, 'PUT', 'id');
  const handleDeleteProduct = (productId) => handleProductOperation({ _id: productId }, 'DELETE', 'id');

  return {
    products,
    loading: loading || modalLoading,
    fetchProducts,
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    refreshProductReviews 
  };
};