const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchProducts(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_URL}/products?${query}`);
  return res.json();
}
