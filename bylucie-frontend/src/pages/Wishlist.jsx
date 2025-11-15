import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '@clerk/clerk-react';
import { FaHeart, FaShoppingCart, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

export default function Wishlist() {
  const { addItem } = useContext(CartContext);
  const { currencyCode, convertPrice, formatPrice } = useCurrency();
  const { userId, getToken, isLoaded } = useAuth();
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      if (!userId) {
        setError('Please sign in to view your wishlist');
        setLoading(false);
        return;
      }

      const token = await getToken();
      const response = await fetch('/api/user/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items || []);
        setError('');
      } else {
        setError('Failed to load wishlist');
      }
    } catch (err) {
      setError('Error loading wishlist');
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (userId) {
        fetchWishlist();
      } else {
        setLoading(false);
        setError('Please sign in to view your wishlist');
      }
    }
  }, [userId, isLoaded]);

  const removeFromWishlist = async (productId) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/user/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
      } else {
        setError('Failed to remove item from wishlist');
      }
    } catch (err) {
      setError('Error removing from wishlist');
      console.error('Error removing from wishlist:', err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  if (error && !userId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-600 mb-4">Sign In Required</h2>
          <p className="text-gray-500 mb-8">{error}</p>
          <a href="/sign-in" className="bg-[#b8860b] text-white px-6 py-3 rounded-lg">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen p-6 font-serif text-[#002200] max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#b8860b] mb-8">Your Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl text-gray-300 mb-4">❤️</div>
          <h2 className="text-2xl text-gray-600 mb-4">Your wishlist is empty</h2>
          <a href="/products" className="bg-[#b8860b] text-white px-6 py-3 rounded-lg">Browse Products</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.productId} className="flex flex-col p-4 border border-[#b8860b] rounded-lg bg-[#fff8e1] relative">
              <button
                onClick={() => removeFromWishlist(item.productId)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded-full p-2"
              >
                <FaTrash size={14} />
              </button>
              
              <img
                src={item.product.image || item.product.images?.[0]?.url || '/api/placeholder/300/300'}
                alt={item.product.name}
                className="rounded-lg mb-3 w-full h-48 object-cover"
              />
              
              <h2 className="text-lg font-semibold mb-2">{item.product.name}</h2>
              <p className="text-[#ff8c00] font-bold mb-3">
                {formatPrice(convertPrice(item.product.priceUSD || item.product.price))} {currencyCode}
              </p>
              
              <button
                onClick={() => addItem(item.product)}
                disabled={item.product.stock <= 0}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 font-semibold rounded ${
                  item.product.stock <= 0 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-[#b8860b] hover:bg-[#997500] text-white'
                }`}
              >
                <FaShoppingCart size={14} />
                <span>{item.product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}