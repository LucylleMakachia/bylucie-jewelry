import React, { useState } from 'react';
import { FaStar, FaRegStar, FaSync } from 'react-icons/fa';

function ProductsManager({ 
  products, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct,
  onRefreshProductStats 
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [refreshingProduct, setRefreshingProduct] = useState(null);

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
    setViewMode('list');
    setDeleteConfirm(null);
  };

  const handleDeleteClick = (productId) => {
    setDeleteConfirm(productId);
  };

  const confirmDelete = (productId) => {
    onDeleteProduct(productId);
    setDeleteConfirm(null);
    if (viewMode === 'detail') {
      handleBackToList();
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // NEW: Handle refresh product review statistics
  const handleRefreshProductStats = async (productId) => {
    if (!onRefreshProductStats) return;
    
    setRefreshingProduct(productId);
    try {
      await onRefreshProductStats(productId);
    } catch (error) {
      console.error('Failed to refresh product stats:', error);
    } finally {
      setRefreshingProduct(null);
    }
  };

  // NEW: Render star rating component
  const renderStars = (rating) => {
    const numericRating = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return starValue <= numericRating ? (
        <FaStar key={starValue} className="w-4 h-4 text-yellow-400" />
      ) : (
        <FaRegStar key={starValue} className="w-4 h-4 text-gray-300" />
      );
    });
  };

  // Product Detail View
  if (viewMode === 'detail' && selectedProduct) {
    const productImages = Array.isArray(selectedProduct.images) ? selectedProduct.images : [];
    const productPrice = selectedProduct.price || 0;
    const productStock = selectedProduct.stock || 0;
    const productStatus = selectedProduct.status || 'active';
    const productRating = selectedProduct.rating || 0;
    const productReviewCount = selectedProduct.reviewCount || 0;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToList}
              className="flex items-center text-gray-600 hover:text-[#b8860b] transition-colors"
            >
              ← Back to Products
            </button>
            <div className="flex space-x-2">
              {/* NEW: Refresh Review Stats Button */}
              <button
                onClick={() => handleRefreshProductStats(selectedProduct._id || selectedProduct.id)}
                disabled={refreshingProduct === (selectedProduct._id || selectedProduct.id)}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshingProduct === (selectedProduct._id || selectedProduct.id) ? (
                  <>
                    <FaSync className="animate-spin mr-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <FaSync className="mr-2" />
                    Refresh Stats
                  </>
                )}
              </button>
              <button
                onClick={() => onEditProduct(selectedProduct)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Product
              </button>
              <button
                onClick={() => handleDeleteClick(selectedProduct._id || selectedProduct.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4">
                {productImages.length > 0 ? (
                  <img 
                    src={typeof productImages[0] === 'string' ? productImages[0] : productImages[0].url} 
                    alt={selectedProduct.name}
                    className="w-full h-80 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iMC4zNWVtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhYSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                    }}
                  />
                ) : (
                  <div className="h-80 w-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={typeof image === 'string' ? image : image.url}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      className="w-full h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-[#b8860b]"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIwLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWEiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedProduct.name || 'Unnamed Product'}</h1>
                
                {/* NEW: Review Statistics */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(productRating)}
                  </div>
                  <span className="text-lg text-gray-600">
                    {productRating > 0 ? productRating.toFixed(1) : 'No ratings'} 
                    {productReviewCount > 0 && ` (${productReviewCount} review${productReviewCount !== 1 ? 's' : ''})`}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-2xl font-bold text-[#b8860b]">
                    KES {productPrice.toLocaleString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    productStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {productStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Product ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {selectedProduct._id || selectedProduct.id || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">SKU:</span>
                  <span className="text-gray-900">{selectedProduct.sku || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Category:</span>
                  <span className="text-gray-900 capitalize">{selectedProduct.category || 'Uncategorized'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Brand:</span>
                  <span className="text-gray-900 capitalize">{selectedProduct.brand || 'Generic'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Stock Level:</span>
                  <span className={`font-medium ${
                    productStock > 10 ? 'text-green-600' : 
                    productStock > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {productStock} units
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    productStatus === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {productStatus}
                  </span>
                </div>
                {/* NEW: Review Statistics */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Customer Rating:</span>
                  <span className="text-gray-900 font-medium">
                    {productRating > 0 ? `${productRating.toFixed(1)}/5` : 'No ratings'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Total Reviews:</span>
                  <span className="text-gray-900 font-medium">{productReviewCount}</span>
                </div>
                {selectedProduct.lowStockThreshold && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium text-gray-600">Low Stock Alert:</span>
                    <span className="text-orange-600 font-medium">
                      Below {selectedProduct.lowStockThreshold} units
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedProduct.description || 'No description available.'}
                </p>
              </div>

              {/* Materials */}
              {selectedProduct.materials && selectedProduct.materials.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Materials</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.materials.map((material, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Creation Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Product History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Created:</span>
                    <p className="text-gray-900">
                      {selectedProduct.createdAt ? 
                        new Date(selectedProduct.createdAt).toLocaleDateString('en-KE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Updated:</span>
                    <p className="text-gray-900">
                      {selectedProduct.updatedAt ? 
                        new Date(selectedProduct.updatedAt).toLocaleDateString('en-KE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Unknown'}
                    </p>
                  </div>
                  {/* NEW: Last Review Update */}
                  {selectedProduct.lastReviewUpdate && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Reviews Last Updated:</span>
                      <p className="text-gray-900">
                        {new Date(selectedProduct.lastReviewUpdate).toLocaleDateString('en-KE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirm === (selectedProduct._id || selectedProduct.id) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "{selectedProduct.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmDelete(selectedProduct._id || selectedProduct.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Product List View
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Products Management</h2>
            <p className="text-gray-600 mt-1">Manage your product catalog and inventory</p>
          </div>
          <button
            onClick={onAddProduct}
            className="bg-[#b8860b] text-white px-4 py-2 rounded-md hover:bg-[#997500] transition-colors whitespace-nowrap"
          >
            Add New Product
          </button>
        </div>
        
        {/* Summary Stats - UPDATED with review stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-blue-800">Total Products</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => (p.stock || 0) > 0).length}
            </div>
            <div className="text-sm text-green-800">In Stock</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 5)).length}
            </div>
            <div className="text-sm text-orange-800">Low Stock</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => (p.stock || 0) === 0).length}
            </div>
            <div className="text-sm text-red-800">Out of Stock</div>
          </div>
          {/* NEW: Review Statistics */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {products.filter(p => (p.rating || 0) > 0).length}
            </div>
            <div className="text-sm text-purple-800">Rated Products</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {products.reduce((total, p) => total + (p.reviewCount || 0), 0)}
            </div>
            <div className="text-sm text-indigo-800">Total Reviews</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reviews
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const productImages = Array.isArray(product.images) ? product.images : [];
              const productStock = product.stock || 0;
              const productStatus = product.status || 'active';
              const productRating = product.rating || 0;
              const productReviewCount = product.reviewCount || 0;
              
              return (
                <tr key={product._id || product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {productImages.length > 0 ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={typeof productImages[0] === 'string' ? productImages[0] : productImages[0].url}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIwLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5Y2EzYWEiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div 
                          className="text-sm font-medium text-gray-900 hover:text-[#b8860b] cursor-pointer transition-colors"
                          onClick={() => handleViewProduct(product)}
                        >
                          {product.name || 'Unnamed Product'}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description ? 
                            (product.description.length > 50 ? 
                              `${product.description.substring(0, 50)}...` : 
                              product.description
                            ) : 
                            'No description'
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {product.category || 'Uncategorized'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {(product.price || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-medium ${
                      productStock > 10 ? 'text-green-600' : 
                      productStock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {productStock}
                    </span>
                  </td>
                  {/* NEW: Reviews Column */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(productRating)}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({productReviewCount})
                      </span>
                      {onRefreshProductStats && (
                        <button
                          onClick={() => handleRefreshProductStats(product._id || product.id)}
                          disabled={refreshingProduct === (product._id || product.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Refresh review statistics"
                        >
                          <FaSync className={`w-3 h-3 ${refreshingProduct === (product._id || product.id) ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      productStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {productStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewProduct(product)}
                      className="text-blue-600 hover:text-blue-800 mr-3 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditProduct(product)}
                      className="text-[#b8860b] hover:text-[#997500] mr-3 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product._id || product.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No products found</div>
            <div className="text-gray-500 text-sm">Get started by adding your first product</div>
            <button
              onClick={onAddProduct}
              className="mt-4 bg-[#b8860b] text-white px-4 py-2 rounded-md hover:bg-[#997500] transition-colors"
            >
              Add Your First Product
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for List View */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsManager;