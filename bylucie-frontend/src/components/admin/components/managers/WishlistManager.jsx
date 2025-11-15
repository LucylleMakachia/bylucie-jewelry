import React, { useState } from 'react';

function WishlistManager({ wishlistData, products, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  if (!wishlistData) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="text-center text-gray-500">
          <p>Loading wishlist data...</p>
        </div>
      </div>
    );
  }

  const { items = [], totalItems = 0, uniqueUsers = 0, popularItems = [] } = wishlistData;

  // Helper function to get product details
  const getProductDetails = (productId) => {
    return products.find(p => p._id === productId || p.id === productId);
  };

  // Helper to get product image
  const getProductImage = (product, item) => {
    if (product?.images?.[0]) {
      return typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
    }
    // Fallback to backend-provided image
    return item.productImage || '/images/placeholder.jpg';
  };

  // Helper to get product name
  const getProductName = (product, item) => {
    return product?.name || item.productName || 'Unknown Product';
  };

  // Helper to get product price
  const getProductPrice = (product, item) => {
    return product?.price || item.productPrice || 0;
  };

  // Get user's wishlist items
  const getUserWishlistItems = (userId) => {
    return items.filter(item => item.userId === userId);
  };

  // Open user details modal
  const handleUserClick = (userId, userName) => {
    setSelectedUser({ 
      userId, 
      userName,
      items: getUserWishlistItems(userId)
    });
    setShowUserModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Wishlist Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Wishlist Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
            <span className="text-2xl text-red-500">❤️</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Across all users</p>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Users</p>
              <p className="text-2xl font-bold">{uniqueUsers}</p>
            </div>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">With saved items</p>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Most Wished Item</p>
              <p className="text-lg font-bold truncate">
                {popularItems[0]?.productName || 'None'}
              </p>
            </div>
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {popularItems[0]?.wishlistCount ? `${popularItems[0].wishlistCount} users` : 'No data'}
          </p>
        </div>
      </div>

      {/* Popular Wishlist Items */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Most Popular Wishlist Items</h3>
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
        
        <div className="space-y-3">
          {popularItems.slice(0, 5).map((item, index) => {
            const product = getProductDetails(item.productId);
            const productName = getProductName(product, item);
            const productImage = getProductImage(product, item);
            const productPrice = getProductPrice(product, item);

            return (
              <div key={item.productId || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-lg font-semibold text-gray-500 w-6">#{index + 1}</span>
                  <img 
                    src={productImage}
                    alt={productName}
                    className="w-10 h-10 object-cover rounded"
                    onError={(e) => {
                      e.target.src = '/images/placeholder.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{productName}</p>
                    <p className="text-sm text-gray-500">
                      KES {productPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-red-500 font-semibold flex items-center">
                    <span className="mr-1">❤️</span>
                    {item.wishlistCount || 0}
                  </span>
                  <span className="text-sm text-gray-500">{item.wishlistCount || 0} users</span>
                </div>
              </div>
            );
          })}
          {popularItems.length === 0 && (
            <p className="text-center text-gray-500 py-8">No wishlist data available</p>
          )}
        </div>
      </div>

      {/* Recent Wishlist Activity */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Wishlist Activity</h3>
        <div className="space-y-3">
          {items.slice(0, 10).map((item, index) => {
            const product = getProductDetails(item.productId);
            const productName = getProductName(product, item);
            const productImage = getProductImage(product, item);
            const productPrice = getProductPrice(product, item);

            return (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3 flex-1">
                  <img 
                    src={productImage}
                    alt={productName}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      e.target.src = '/images/placeholder.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{productName}</p>
                    <p 
                      className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 transition-colors hover:underline"
                      onClick={() => handleUserClick(item.userId, item.userName)}
                      title="View user's wishlist"
                    >
                      Added by {item.userName || `user ${item.userId ? item.userId.substring(0, 8) + '...' : 'Unknown'}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Recently'}
                  </p>
                  <p className="text-[#b8860b] font-semibold">
                    KES {productPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-center text-gray-500 py-8">No recent wishlist activity</p>
          )}
        </div>
      </div>

      {/* Wishlist Analytics */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Wishlist Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-800">Conversion Opportunity</p>
            <p className="text-sm text-blue-600 mt-1">
              {items.filter(item => !item.inCart).length} items not in carts
            </p>
            <p className="text-xs text-blue-500 mt-2">
              These items are saved but not yet purchased
            </p>
          </div>
          
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <p className="font-semibold text-green-800">Potential Revenue</p>
            <p className="text-sm text-green-600 mt-1">
              KES {items.reduce((sum, item) => {
                const product = getProductDetails(item.productId);
                return sum + getProductPrice(product, item);
              }, 0).toLocaleString()}
            </p>
            <p className="text-xs text-green-500 mt-2">
              Total value of all wishlisted items
            </p>
          </div>
        </div>
      </div>

      {/* User Wishlist Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold">User Wishlist Details</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedUser.items.length} items in wishlist
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl p-1 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium text-sm font-mono break-all">
                    {selectedUser.userId || 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">User Name</p>
                  <p className="font-medium">
                    {selectedUser.userName || 'Anonymous User'}
                  </p>
                </div>
              </div>
              
              {/* Wishlist Items */}
              <div>
                <h4 className="font-semibold mb-4 text-lg">Wishlist Items</h4>
                {selectedUser.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.items.map((item, index) => {
                      const product = getProductDetails(item.productId);
                      const productName = getProductName(product, item);
                      const productImage = getProductImage(product, item);
                      const productPrice = getProductPrice(product, item);
                      const productCategory = item.productCategory || product?.category || 'Uncategorized';

                      return (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4 flex-1">
                            <img 
                              src={productImage}
                              alt={productName}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.target.src = '/images/placeholder.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-lg truncate">{productName}</p>
                              <p className="text-sm text-gray-600 capitalize">{productCategory}</p>
                              <p className="text-[#b8860b] font-semibold text-lg">
                                KES {productPrice.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Added on {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'deleted' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.status === 'deleted' ? 'Product Unavailable' : 'Available'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">No items in user's wishlist</p>
                    <p className="text-sm text-gray-400 mt-2">This user hasn't added any items yet</p>
                  </div>
                )}
              </div>

              {/* User Statistics */}
              {selectedUser.items.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-3">Wishlist Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.items.length}</p>
                      <p className="text-xs text-blue-500">Total Items</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        KES {selectedUser.items.reduce((sum, item) => {
                          const product = getProductDetails(item.productId);
                          return sum + getProductPrice(product, item);
                        }, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-green-500">Total Value</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedUser.items.filter(item => item.status !== 'deleted').length}
                      </p>
                      <p className="text-xs text-purple-500">Available Items</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600">
                        {new Set(selectedUser.items.map(item => item.productCategory)).size}
                      </p>
                      <p className="text-xs text-gray-500">Categories</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={onRefresh}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WishlistManager;