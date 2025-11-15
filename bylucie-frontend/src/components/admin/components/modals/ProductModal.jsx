import React, { useState, useEffect } from 'react';

function ProductModal({ visible, onClose, onSubmit, defaultData, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    discountPercentage: '',
    materials: [],
    status: 'active',
    images: []
  });
  const [imageInput, setImageInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');

  useEffect(() => {
    if (defaultData) {
      setFormData({
        name: defaultData.name || '',
        description: defaultData.description || '',
        price: defaultData.price || '',
        stock: defaultData.stock || '',
        category: defaultData.category || '',
        discountPercentage: defaultData.discountPercentage || '',
        materials: defaultData.materials || [],
        status: defaultData.status || 'active',
        images: defaultData.images || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        discountPercentage: '',
        materials: [],
        status: 'active',
        images: []
      });
    }
  }, [defaultData, visible]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare the product data with proper formatting
    const productData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      discountPercentage: Number(formData.discountPercentage) || 0,
      // NEW: Ensure images are in correct format for backend
      images: formData.images
        .filter(url => url.trim() !== '')
        .map(url => typeof url === 'string' ? { url, public_id: null } : url),
      // NEW: Initialize review statistics for new products
      rating: defaultData?.rating || 0,
      reviewCount: defaultData?.reviewCount || 0,
      reviews: defaultData?.reviews || []
    };

    onSubmit(productData);
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addMaterial = () => {
    if (materialInput.trim() && !formData.materials.includes(materialInput.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, materialInput.trim()]
      }));
      setMaterialInput('');
    }
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scale-in border border-gray-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent">
              {defaultData ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors transform hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                    placeholder="e.g., Jewelry, Accessories"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all resize-vertical"
                  placeholder="Enter product description"
                />
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Pricing & Inventory</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                    placeholder="0"
                  />
                  {formData.discountPercentage > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      Discounted Price: KES {(
                        (Number(formData.price) || 0) * 
                        (1 - (Number(formData.discountPercentage) || 0) / 100)
                      ).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Materials
                  </label>
                  <div className="flex space-x-3 mb-3">
                    <input
                      type="text"
                      value={materialInput}
                      onChange={(e) => setMaterialInput(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                      placeholder="Enter material (e.g., Gold, Silver)"
                    />
                    <button
                      type="button"
                      onClick={addMaterial}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Add
                    </button>
                  </div>

                  {formData.materials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.materials.map((material, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {material}
                          <button
                            type="button"
                            onClick={() => removeMaterial(index)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Images</h3>
              
              <div className="flex space-x-3 mb-4">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
                  placeholder="Enter image URL (https://...)"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-6 py-3 bg-gradient-to-r from-[#b8860b] to-[#daa520] text-white font-semibold rounded-xl hover:from-[#daa520] hover:to-[#b8860b] transition-all transform hover:scale-105 shadow-lg"
                >
                  Add
                </button>
              </div>

              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={typeof image === 'string' ? image : image.url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-xl border-2 border-gray-300"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iMC4zNWVtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhYSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No images added yet</p>
                </div>
              )}
            </div>

            {/* Review Statistics (Read-only for existing products) */}
            {defaultData && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Review Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-700">Customer Rating:</span>
                    <span className="text-blue-900 font-semibold">
                      {defaultData.rating ? `${defaultData.rating.toFixed(1)}/5` : 'No ratings yet'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-700">Total Reviews:</span>
                    <span className="text-blue-900 font-semibold">{defaultData.reviewCount || 0}</span>
                  </div>
                </div>
                <p className="text-blue-600 text-sm mt-3">
                  Review statistics are automatically updated when reviews are approved.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#b8860b] to-[#daa520] text-white font-semibold rounded-xl hover:from-[#daa520] hover:to-[#b8860b] transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (defaultData ? 'Update Product' : 'Add Product')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;