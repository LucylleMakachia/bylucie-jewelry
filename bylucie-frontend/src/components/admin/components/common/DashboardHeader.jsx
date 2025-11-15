import React from 'react';

function DashboardHeader({ products, orders, wishlistData, reviewsData, onRefresh, loading }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border shadow-sm">
            <strong>{products.length}</strong> products • <strong>{orders.length}</strong> orders • <strong>{wishlistData?.totalItems || 0}</strong> wishlist • <strong>{reviewsData?.totalReviews || 0}</strong> reviews
          </div>
          <button 
            onClick={onRefresh}
            className="bg-white text-gray-700 px-4 py-2 rounded-xl border shadow-sm hover:bg-gray-50 transition-all transform hover:scale-105"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      <p className="text-gray-600 text-lg">
        Central hub for managing your e-commerce store. Monitor orders, manage products, track business performance, view customer wishlists, and moderate reviews.
      </p>
    </div>
  );
}

export default DashboardHeader;