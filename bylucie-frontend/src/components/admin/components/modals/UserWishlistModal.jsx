import React from 'react';

const UserWishlistModal = ({ 
  user, 
  isOpen, 
  onClose, 
  onRefresh, 
  items, 
  products, 
  getProductDetails,
  getProductImage,
  getProductName,
  getProductPrice 
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold">User Wishlist Details</h3>
            <p className="text-sm text-gray-500 mt-1">
              {user.items.length} items in wishlist
            </p>
          </div>
          <button
            onClick={onClose}
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
                {user.userId || 'Unknown'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">User Name</p>
              <p className="font-medium">
                {user.userName || 'Anonymous User'}
              </p>
            </div>
          </div>
          
          {/* Wishlist Items */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Wishlist Items</h4>
            {user.items.length > 0 ? (
              <div className="space-y-3">
                {user.items.map((item, index) => {
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
          {user.items.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-semibold text-blue-800 mb-3">Wishlist Summary</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{user.items.length}</p>
                  <p className="text-xs text-blue-500">Total Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    KES {user.items.reduce((sum, item) => {
                      const product = getProductDetails(item.productId);
                      return sum + getProductPrice(product, item);
                    }, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-500">Total Value</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {user.items.filter(item => item.status !== 'deleted').length}
                  </p>
                  <p className="text-xs text-purple-500">Available Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">
                    {new Set(user.items.map(item => item.productCategory)).size}
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
            onClick={onClose}
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
  );
};

export default UserWishlistModal;