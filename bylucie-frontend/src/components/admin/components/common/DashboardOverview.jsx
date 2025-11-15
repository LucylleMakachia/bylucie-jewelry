import React from 'react';

function DashboardOverview({ analytics, products, orders, wishlistData, reviewsData, onAddProduct }) {
  const { today, alerts } = analytics.dashboardStats;
  
  return (
    <div className="space-y-8 mb-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {[
          { label: "Today's Revenue", value: `KES ${today.revenue.toLocaleString()}`, icon: "💰", sub: `${today.orders} orders`, color: "from-green-500 to-green-600" },
          { label: "Total Products", value: products.length, icon: "🛍️", sub: `${alerts.lowStock} low stock`, color: "from-blue-500 to-blue-600" },
          { label: "Pending Orders", value: alerts.pendingOrders, icon: "⏳", sub: "Need attention", color: "from-amber-500 to-amber-600" },
          { label: "Total Customers", value: analytics.overview.totalUsers, icon: "👥", sub: `${analytics.overview.newUsers} new this month`, color: "from-purple-500 to-purple-600" },
          { label: "Wishlist Items", value: wishlistData?.totalItems || 0, icon: "❤️", sub: `${wishlistData?.uniqueUsers || 0} users`, color: "from-pink-500 to-pink-600" },
          { label: "Customer Reviews", value: reviewsData?.totalReviews || 0, icon: "⭐", sub: `${reviewsData?.averageRating || 0} avg rating`, color: "from-indigo-500 to-indigo-600" }
        ].map((stat, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-2xl text-white">{stat.icon}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <button
            onClick={onAddProduct}
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 transform hover:scale-105 group"
          >
            <span className="text-3xl mr-3 group-hover:scale-110 transition-transform">➕</span>
            <span className="font-semibold text-gray-700">Add New Product</span>
          </button>
          
          <div className="p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-orange-800 text-lg">{alerts.pendingOrders}</p>
                <p className="text-orange-600 font-medium">Pending Orders</p>
                <p className="text-sm text-orange-500 mt-1">Need your attention</p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <div className="p-6 border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-red-800 text-lg">{alerts.lowStock}</p>
                <p className="text-red-600 font-medium">Low Stock Items</p>
                <p className="text-sm text-red-500 mt-1">Restock needed</p>
              </div>
              <span className="text-3xl">📦</span>
            </div>
          </div>

          <div className="p-6 border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-pink-800 text-lg">{wishlistData?.totalItems || 0}</p>
                <p className="text-pink-600 font-medium">Wishlist Items</p>
                <p className="text-sm text-pink-500 mt-1">{wishlistData?.uniqueUsers || 0} users saving</p>
              </div>
              <span className="text-3xl">❤️</span>
            </div>
          </div>

          <div className="p-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-800 text-lg">{reviewsData?.totalReviews || 0}</p>
                <p className="text-blue-600 font-medium">Reviews</p>
                <p className="text-sm text-blue-500 mt-1">{reviewsData?.pendingReviews || 0} pending</p>
              </div>
              <span className="text-3xl">⭐</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;