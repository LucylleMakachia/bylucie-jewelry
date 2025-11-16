import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-react';

import Layout from './components/Layout.jsx';
import PageLoader from './components/PageLoader.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import AdminDashboard from './components/admin/AdminDashboard';

import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import AccessDenied from './pages/AccessDenied.jsx';
import UnauthorizedMessage from './components/UnauthorizedMessage.jsx';

import { CurrencyProvider } from './contexts/CurrencyContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const Home = lazy(() => import('./pages/Home.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const CartPage = lazy(() => import('./pages/Cart.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const SignIn = lazy(() => import('./pages/SignIn.jsx'));
const SignUp = lazy(() => import('./pages/SignUp.jsx'));
const Verify = lazy(() => import('./pages/Verify.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));

function App() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  
  // API Base URL - FIXED
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  // Simple toast function for basic notifications
  const showToast = (message, type = 'info') => {
    console.log(`Toast (${type}):`, message);
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(message, type);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // FIXED: Use correct Flask endpoint
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        if (res.status === 0 || res.status === 404) {
          throw new Error('Cannot connect to backend server. Please check if Flask server is running.');
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Handle both array and object responses
      const productsArray = Array.isArray(data) ? data : (data.products || []);
      
      const sanitizedProducts = productsArray.map(product => {
        let imageUrl = '';
        let images = [];
        
        if (product.imageUrl) {
          imageUrl = product.imageUrl;
          images = [product.imageUrl];
        } else if (product.images && product.images.length > 0) {
          const firstImage = product.images[0];
          if (typeof firstImage === 'object' && firstImage.url) {
            imageUrl = firstImage.url;
            images = product.images.map(img => img.url || img);
          } else {
            imageUrl = firstImage;
            images = product.images;
          }
        } else if (product.image) {
          imageUrl = product.image;
          images = [product.image];
        } else {
          imageUrl = '/images/placeholder.jpg';
          images = ['/images/placeholder.jpg'];
        }
        
        const price = Number(product.price) || 0;
        
        return {
          _id: product._id || product.id || `product-${Math.random()}`,
          name: product.name || 'Unnamed Product',
          description: product.description || 'No description available',
          price: price,
          images: images,
          imageUrl: imageUrl,
          category: product.category || 'Uncategorized',
          rating: Number(product.rating) || 0,
          reviewCount: Number(product.reviewCount) || 0,
          inStock: product.inStock !== undefined ? product.inStock : true,
          material: product.material || 'Unknown',
          color: product.color || 'Various',
          stock: product.stock || product.stock_quantity || 0,
          ...product
        };
      });
      
      setProducts(sanitizedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      
      if (err.message.includes('Failed to fetch') || err.message.includes('Cannot connect')) {
        setError('Backend server is not running. Please start your Flask server on port 5000.');
      } else {
        setError(`Cannot connect to server: ${err.message}`);
      }
      
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleProductsUpdate = () => {
      fetchProducts();
    };
    
    window.addEventListener('productsUpdated', handleProductsUpdate);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchProducts();
  };

  // Loading component for consistent loading states
  const LoadingFallback = ({ message = "Loading..." }) => (
    <div className="flex justify-center items-center p-8 mt-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b8860b]"></div>
      <span className="ml-4 text-gray-600">{message}</span>
    </div>
  );

  // Error component for consistent error handling
  const ErrorFallback = ({ error, onRetry }) => (
    <div className="flex justify-center items-center p-8 mt-24">
      <div className="text-center max-w-md">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="space-y-2">
          <button
            onClick={onRetry}
            className="bg-[#b8860b] hover:bg-[#997500] text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Retry Connection
          </button>
          {error.includes('Backend server is not running') && (
            <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded">
              <p className="font-medium">💡 Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-1 text-left">
                <li>Make sure your Flask server is running on port 5000</li>
                <li>Run: <code>python app.py</code> in your backend directory</li>
                <li>Check if the Flask server started successfully</li>
                <li>Verify the API endpoint: {API_BASE_URL}/api/products</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Common props for product-related components
  const commonProductProps = {
    products,
    getToken,
    showToast,
    user,
    onProductsUpdate: fetchProducts  // Add this for refreshing products
  };

  // Show products immediately, auth will load in background
  if (!isLoaded) {
    return (
      <I18nextProvider i18n={i18n}>
        <CurrencyProvider>
          <CartProvider>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes work immediately */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/sign-up" element={<SignUp />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/access-denied" element={<AccessDenied />} />
                  <Route path="/unauthorized-message" element={<UnauthorizedMessage />} />

                  {/* Products routes */}
                  <Route
                    path="/products"
                    element={
                      loading ? (
                        <LoadingFallback message="Loading products..." />
                      ) : error ? (
                        <ErrorFallback error={error} onRetry={handleRetry} />
                      ) : (
                        <Products {...commonProductProps} />
                      )
                    }
                  />
                  
                  {/* Product Detail Route */}
                  <Route 
                    path="/products/:productId" 
                    element={
                      loading ? (
                        <LoadingFallback message="Loading product details..." />
                      ) : error ? (
                        <ErrorFallback error={error} onRetry={handleRetry} />
                      ) : (
                        <ProductDetail {...commonProductProps} />
                      )
                    } 
                  />

                  {/* Protected routes show loading or redirect */}
                  <Route path="/wishlist" element={<LoadingFallback message="Checking authentication..." />} />
                  <Route path="/profile" element={<LoadingFallback message="Checking authentication..." />} />
                  <Route path="/settings" element={<LoadingFallback message="Checking authentication..." />} />
                  <Route path="/admindashboard" element={<LoadingFallback message="Checking authentication..." />} />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<PageLoader path={location.pathname} />} />
                </Routes>
              </Suspense>
            </Layout>
          </CartProvider>
        </CurrencyProvider>
      </I18nextProvider>
    );
  }

  // Once auth is loaded, show the full app with protected routes
  return (
    <I18nextProvider i18n={i18n}>
      <CurrencyProvider>
        <CartProvider>
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="/unauthorized-message" element={<UnauthorizedMessage />} />

                {/* Products routes */}
                <Route
                  path="/products"
                  element={
                    loading ? (
                      <LoadingFallback message="Loading products..." />
                    ) : error ? (
                      <ErrorFallback error={error} onRetry={handleRetry} />
                    ) : (
                      <Products {...commonProductProps} />
                    )
                  }
                />
                
                {/* Product Detail Route */}
                <Route 
                  path="/products/:productId" 
                  element={
                    loading ? (
                      <LoadingFallback message="Loading product details..." />
                    ) : error ? (
                      <ErrorFallback error={error} onRetry={handleRetry} />
                    ) : (
                      <ProductDetail {...commonProductProps} />
                    )
                  } 
                />

                {/* Protected routes */}
                <Route
                  path="/wishlist"
                  element={
                    <SignedIn>
                      {loading ? (
                        <LoadingFallback message="Loading products..." />
                      ) : error ? (
                        <ErrorFallback error={error} onRetry={handleRetry} />
                      ) : (
                        <Wishlist {...commonProductProps} />
                      )}
                    </SignedIn>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <SignedIn>
                      {loading ? (
                        <LoadingFallback message="Loading profile..." />
                      ) : error ? (
                        <ErrorFallback error={error} onRetry={handleRetry} />
                      ) : (
                        <Profile {...commonProductProps} />
                      )}
                    </SignedIn>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <SignedIn>
                      <Settings />
                    </SignedIn>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admindashboard"
                  element={
                    <SignedIn>
                      <RequireAdmin>
                        <AdminDashboard />
                      </RequireAdmin>
                    </SignedIn>
                  }
                />

                {/* Catch-all route */}
                <Route path="*" element={<PageLoader path={location.pathname} />} />
              </Routes>
            </Suspense>
          </Layout>
        </CartProvider>
      </CurrencyProvider>
    </I18nextProvider>
  );
}

export default App;