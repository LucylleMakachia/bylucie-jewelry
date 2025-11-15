import React, { useState, useEffect } from 'react';
import { useAuth, useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import ProductsManager from './components/managers/ProductsManager';
import OrdersManager from './components/managers/OrdersManager';
import AnalyticsManager from './components/managers/AnalyticsManager';
import WishlistManager from './components/managers/WishlistManager';
import ReviewsManager from './components/managers/ReviewsManager';
import ProductModal from './components/modals/ProductModal';
import UnauthorizedMessage from '../../components/UnauthorizedMessage.jsx';

// Hooks
import { useAdminAuth } from './hooks/useAdminAuth';
import { useToast } from './hooks/useToast';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { useAnalytics } from './hooks/useAnalytics';
import { useAdminWishlist } from './hooks/useAdminWishlist'; 
import { useReviews } from './hooks/useReviews';

// Components
import ToastContainer from './components/common/ToastContainer';
import ConfirmationModal from './components/common/ConfirmationModal';
import TabNavigation from './components/common/TabNavigation';
import DashboardOverview from './components/common/DashboardOverview';

function AdminDashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();

  // State
  const [activeTab, setActiveTab] = useState('orders');
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false, title: '', message: '', onConfirm: null, type: 'danger'
  });

  // Custom Hooks
  const { toasts, showToast, removeToast } = useToast();
  const { isAuthorized, authChecked } = useAdminAuth(user);
  const { products, loading, fetchProducts, handleAddProduct, handleEditProduct, handleDeleteProduct, refreshProductReviews } = useProducts(getToken, showToast);
  const { orders, fetchOrders, handleUpdateOrderStatus } = useOrders(getToken, showToast);
  const { analytics, analyticsLoading, fetchAnalytics } = useAnalytics(getToken, orders, products, showToast);
  const { wishlistData, fetchWishlistData, loading: wishlistLoading } = useAdminWishlist(getToken, showToast);
  const { reviewsData, fetchReviewsData, handleReviewAction, handleDeleteReview, reviewActionLoading } = useReviews(getToken, showToast);

  // Initialize data when authorized
  useEffect(() => {
    if (isAuthorized) {
      console.log('🔄 Initializing admin dashboard data...');
      fetchProducts();
      fetchOrders();
      fetchAnalytics();
      fetchWishlistData();
      fetchReviewsData();
    }
  }, [isAuthorized]);

  // Enhanced wishlist refresh with better error handling
  const refreshWishlistData = async () => {
    try {
      showToast('🔄 Refreshing wishlist data...', 'info');
      await fetchWishlistData();
      showToast('✅ Wishlist data refreshed!', 'success');
    } catch (error) {
      showToast('❌ Failed to refresh wishlist data', 'error');
    }
  };

  // Enhanced review action handler with product stats refresh
  const handleReviewActionWithRefresh = async (reviewId, action, adminResponse = '') => {
    try {
      await handleReviewAction(reviewId, action, adminResponse);
      
      // Refresh product review statistics after review action
      if (reviewsData?.reviews) {
        const updatedReview = reviewsData.reviews.find(review => review._id === reviewId);
        if (updatedReview?.productId) {
          await refreshProductReviews(updatedReview.productId);
          showToast('✅ Review processed and product stats updated', 'success');
        }
      }
    } catch (error) {
      showToast('❌ Failed to process review', 'error');
    }
  };

  // Enhanced delete review handler with product stats refresh
  const handleDeleteReviewWithRefresh = async (reviewId) => {
    try {
      // Get product ID before deletion for stats refresh
      const reviewToDelete = reviewsData?.reviews?.find(review => review._id === reviewId);
      const productId = reviewToDelete?.productId;
      
      await handleDeleteReview(reviewId);
      
      // Refresh product review statistics after deletion
      if (productId) {
        await refreshProductReviews(productId);
        showToast('🗑️ Review deleted and product stats updated', 'success');
      }
    } catch (error) {
      showToast('❌ Failed to delete review', 'error');
    }
  };

  // Confirmation modal functions
  const showConfirmation = (title, message, onConfirm, type = 'danger') => {
    setConfirmationModal({ 
      isOpen: true, 
      title, 
      message, 
      onConfirm: () => { 
        onConfirm(); 
        hideConfirmation(); 
      }, 
      type 
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
  };

  // Product name resolution
  const getProductName = (productId) => {
    if (!productId) return 'Unknown Product';
    const product = products.find(p => 
      p._id === productId || 
      p.id === productId ||
      (p._id && p._id.toString() === productId.toString()) ||
      (p.id && p.id.toString() === productId.toString())
    );
    return product ? product.name : 'Unknown Product';
  };

  const getProductInfo = (productId) => {
    if (!productId) return null;
    return products.find(p => 
      p._id === productId || 
      p.id === productId ||
      (p._id && p._id.toString() === productId.toString()) ||
      (p.id && p.id.toString() === productId.toString())
    );
  };

  // Refresh all data including product review stats
  const refreshAllData = async () => {
    try {
      showToast('🔄 Refreshing all data...', 'info');
      await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchAnalytics(),
        fetchWishlistData(),
        fetchReviewsData()
      ]);
      showToast('✅ All data refreshed successfully!', 'success');
    } catch (error) {
      showToast('❌ Failed to refresh some data', 'error');
    }
  };

  // Force refresh product review statistics
  const refreshProductReviewStats = async (productId) => {
    try {
      await refreshProductReviews(productId);
      showToast('✅ Product review statistics refreshed', 'success');
    } catch (error) {
      showToast('❌ Failed to refresh product stats', 'error');
    }
  };

  // Loading and auth states
  if (!isLoaded || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#b8860b] mx-auto mb-4"></div>
          <div className="text-2xl text-[#b8860b] mb-2">Loading...</div>
          <div className="text-gray-600">Checking permissions...</div>
        </div>
      </div>
    );
  }

  if (!userId) return <SignedOut><RedirectToSignIn /></SignedOut>;
  if (!isAuthorized) return <UnauthorizedMessage />;

  return (
    <SignedIn>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          onConfirm={confirmationModal.onConfirm}
          onCancel={hideConfirmation}
          type={confirmationModal.type}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent">Admin Dashboard</h1>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border shadow-sm">
                  <strong>{products.length}</strong> products • <strong>{orders.length}</strong> orders • <strong>{wishlistData?.totalItems || 0}</strong> wishlist • <strong>{reviewsData?.totalReviews || 0}</strong> reviews
                </div>
                <button 
                  onClick={refreshAllData}
                  className="bg-white text-gray-700 px-4 py-2 rounded-xl border shadow-sm hover:bg-gray-50 transition-all transform hover:scale-105"
                  disabled={analyticsLoading || wishlistLoading}
                >
                  {(analyticsLoading || wishlistLoading) ? 'Refreshing...' : 'Refresh All'}
                </button>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              Central hub for managing your e-commerce store. Monitor orders, manage products, track business performance, view customer wishlists, and moderate reviews.
            </p>
          </div>

          <DashboardOverview 
            analytics={analytics} 
            products={products} 
            orders={orders}
            wishlistData={wishlistData}
            reviewsData={reviewsData}
            onAddProduct={() => {
              setEditingProduct(null);
              setIsProductModalVisible(true);
            }}
            onRefreshProductStats={refreshProductReviewStats}
          />

          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="mt-8">
            {activeTab === 'orders' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent mb-3">Orders Management</h2>
                  <p className="text-gray-600 text-lg">View and manage all customer orders.</p>
                </div>
                <OrdersManager
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onRefreshOrders={fetchOrders}
                />
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent mb-3">Products Management</h2>
                  <p className="text-gray-600 text-lg">Manage your product catalog.</p>
                </div>
                <ProductsManager
                  products={products}
                  onAddProduct={() => { setEditingProduct(null); setIsProductModalVisible(true); }}
                  onEditProduct={(product) => { setEditingProduct(product); setIsProductModalVisible(true); }}
                  onDeleteProduct={(productId) => showConfirmation(
                    'Delete Product',
                    'Are you sure you want to delete this product? This action cannot be undone and will remove all associated data.',
                    () => handleDeleteProduct(productId),
                    'danger'
                  )}
                  onRefreshProductStats={refreshProductReviewStats}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent mb-3">Analytics & Reports</h2>
                  <p className="text-gray-600 text-lg">Monitor your store performance.</p>
                </div>
                <AnalyticsManager 
                  analytics={analytics} 
                  showToast={showToast}
                  onRefreshAnalytics={fetchAnalytics}
                />
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent mb-3">Wishlist Management</h2>
                  <p className="text-gray-600 text-lg">Monitor customer wishlists and popular items.</p>
                </div>
                <WishlistManager 
                  wishlistData={wishlistData}
                  products={products}
                  onRefresh={refreshWishlistData}
                  loading={wishlistLoading}
                />
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent mb-3">Reviews Management</h2>
                  <p className="text-gray-600 text-lg">Moderate and manage customer reviews.</p>
                </div>
                <ReviewsManager 
                  reviewsData={reviewsData}
                  products={products}
                  getProductName={getProductName}
                  getProductInfo={getProductInfo}
                  onReviewAction={handleReviewActionWithRefresh}
                  onDeleteReview={handleDeleteReviewWithRefresh}
                  onRefresh={fetchReviewsData}
                  showConfirmation={showConfirmation}
                  showToast={showToast}
                  reviewActionLoading={reviewActionLoading}
                  onRefreshProductStats={refreshProductReviewStats}
                />
              </div>
            )}
          </div>

          <ProductModal
            visible={isProductModalVisible}
            onClose={() => {
              setIsProductModalVisible(false);
              setEditingProduct(null);
            }}
            onSubmit={async (product) => {
              try {
                if (editingProduct) await handleEditProduct(product);
                else await handleAddProduct(product);
                setIsProductModalVisible(false);
                setEditingProduct(null);
              } catch (err) {
                // Error handled in the hook
              }
            }}
            defaultData={editingProduct}
            loading={loading}
          />
        </div>
      </div>
    </SignedIn>
  );
}

export default AdminDashboard;