import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);

  // Fetch CSRF token on hook initialization
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const res = await fetch(`${API_BASE}/api/csrf-token`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch CSRF token');
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error('Error fetching CSRF token:', err);
      }
    }
    fetchCsrfToken();
  }, []);

  // Fetch product list with error and loading state
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/products`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Client-side Cloudinary unsigned upload (use cautiously in production)
  const uploadToCloudinaryClient = useCallback(async (file) => {
    if (!file) return null;
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary client config missing (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)');
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudflare.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    const json = await res.json();
    return json.secure_url;
  }, []);

  // Add product with optional image upload
  const addProduct = useCallback(
    async (productData, file) => {
      try {
        let imageUrl = productData.imageUrl || '';

        if (file) {
          imageUrl = await uploadToCloudinaryClient(file);
        }

        const res = await fetch(`${API_BASE}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ ...productData, imageUrl }),
        });
        if (!res.ok) throw new Error('Failed to add product');
        const saved = await res.json();

        setProducts((prev) => [saved, ...prev]);
        return saved;
      } catch (err) {
        throw err;
      }
    },
    [uploadToCloudinaryClient, csrfToken]
  );

  // Edit product with optional image upload
  const editProduct = useCallback(
    async (id, updatedData, file) => {
      try {
        let imageUrl = updatedData.imageUrl || '';

        if (file) {
          imageUrl = await uploadToCloudinaryClient(file);
        }

        const res = await fetch(`${API_BASE}/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ ...updatedData, imageUrl }),
        });
        if (!res.ok) throw new Error('Failed to update product');
        const updated = await res.json();

        setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
        return updated;
      } catch (err) {
        throw err;
      }
    },
    [uploadToCloudinaryClient, csrfToken]
  );

  // Delete product
  const deleteProduct = useCallback(
    async (id) => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to delete product');
        setProducts((prev) => prev.filter((p) => p._id !== id));
        return true;
      } catch (err) {
        throw err;
      }
    },
    [csrfToken]
  );

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    editProduct,
    deleteProduct,
  };
}
