import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useWishlist } from '../hooks/useWishlist';
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar, FaShare, FaArrowLeft, FaRegStar, FaSearchPlus, FaSearchMinus, FaSync, FaUserCircle } from 'react-icons/fa';
import ReviewForm from '../components/ReviewForm';

export default function ProductDetail({ products, getToken, showToast, user }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const { formatPrice } = useCurrency();
  
  // UPDATED: Use enhanced wishlist hook
  const { 
    toggleWishlist, 
    isInWishlist, 
    loading: wishlistLoading 
  } = useWishlist(getToken, showToast, user);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [refreshingReviews, setRefreshingReviews] = useState(false);

  // Fixed star rating component with unique keys
  const renderStars = (rating, size = 'w-5 h-5', uniquePrefix = 'default') => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const uniqueKey = `${uniquePrefix}-star-${starValue}`;
      return starValue <= rating ? (
        <FaStar key={uniqueKey} className={`${size} text-yellow-400`} />
      ) : (
        <FaRegStar key={uniqueKey} className={`${size} text-gray-300`} />
      );
    });
  };

  // Fetch product with approved reviews
  const fetchProductWithReviews = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch product details
      const productRes = await fetch(`/api/products/${productId}`, {
        credentials: 'include'
      });
      
      if (!productRes.ok) throw new Error(`Failed to fetch product: ${productRes.status}`);
      
      const productData = await productRes.json();
      setProduct(productData.product);
      
      // Fetch reviews separately to get full review data
      const reviewsRes = await fetch(`/api/products/${productId}/reviews?status=approved`, {
        credentials: 'include'
      });
      
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      } else {
        // Fallback to product reviews if dedicated endpoint fails
        setReviews(productData.product.reviews || []);
      }
      
      if (productData.product.category && products && products.length > 0) {
        const related = products
          .filter(p => p._id !== productId && p.category === productData.product.category)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh reviews without reloading entire product
  const refreshReviews = async () => {
    if (!productId) return;
    
    try {
      setRefreshingReviews(true);
      // Use dedicated reviews endpoint to get full review data
      const res = await fetch(`/api/products/${productId}/reviews?status=approved`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const reviewsData = await res.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (err) {
      console.error('Error refreshing reviews:', err);
    } finally {
      setRefreshingReviews(false);
    }
  };

  // Find product from props or fetch individually
  useEffect(() => {
    if (!productId) {
      setError('Product ID is missing');
      setLoading(false);
      return;
    }

    if (products && products.length > 0) {
      const foundProduct = products.find(p => p._id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        // Fetch reviews separately for full data
        refreshReviews();
        setLoading(false);
        
        if (foundProduct.category) {
          const related = products
            .filter(p => p._id !== productId && p.category === foundProduct.category)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } else {
        fetchProductWithReviews();
      }
    } else {
      fetchProductWithReviews();
    }
  }, [productId, products]);

  // Calculate rating and count from approved reviews
  const approvedReviews = reviews.filter(review => 
    review && (review.status === 'approved' || review.approved === true)
  );
  const calculatedAverageRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / approvedReviews.length
    : 0;
  const calculatedTotalReviews = approvedReviews.length;

  // Format date for reviews
  const formatReviewDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    setIsZooming(true);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
    if (zoomLevel - 0.5 <= 1) {
      setIsZooming(false);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseMove = (e) => {
    if (!isZooming || zoomLevel <= 1) return;
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({ x, y });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZooming(false);
    setPosition({ x: 0, y: 0 });
  };

  // UPDATED: Use hook's toggle function
  const handleWishlistToggle = async () => {
    if (!product) return;
    await toggleWishlist(product._id);
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const maxStock = product?.stock || 10;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleReviewSubmit = (newReview) => {
    // Only add to reviews if the review is approved or has approved status
    if (newReview.approved || newReview.status === 'approved') {
      setReviews(prevReviews => [newReview, ...prevReviews]);
    }
    // Refresh reviews after a short delay to ensure backend has processed
    setTimeout(() => {
      refreshReviews();
    }, 1000);
  };

  const getProductImages = (product) => {
    if (!product) return [];
    
    if (product.images && product.images.length > 0) {
      return product.images.map(img => 
        typeof img === 'object' && img.url ? img.url : img
      );
    }
    
    if (product.imageUrl) {
      return [product.imageUrl];
    }
    
    return ['/images/placeholder.jpg'];
  };

  const handleImageError = (e) => {
    e.target.src = '/images/placeholder.jpg';
    e.target.alt = 'Image not available';
  };

  // Simple Review Display Component
  const SimpleReviewDisplay = () => {
    if (approvedReviews.length === 0) {
      return (
        <div className="text-center py-8">
          <FaUserCircle className="mx-auto text-4xl text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">
            Be the first to review this product and share your experience with other customers.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Customer Reviews ({approvedReviews.length})
          </h3>
          <button
            onClick={refreshReviews}
            disabled={refreshingReviews}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
            title="Refresh reviews"
          >
            <FaSync className={refreshingReviews ? 'animate-spin' : ''} />
            {refreshingReviews ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {approvedReviews.map((review) => (
          <div key={review._id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {review.userImage ? (
                    <img 
                      src={review.userImage} 
                      alt={review.userName}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/placeholder.jpg';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{review.userName}</p>
                  <p className="text-sm text-gray-500">{review.userEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 mb-1">
                  {renderStars(review.rating, 'w-4 h-4', `review-${review._id}`)}
                </div>
                <p className="text-sm text-gray-500">
                  {formatReviewDate(review.createdAt)}
                </p>
              </div>
            </div>

            {review.comment && (
              <p className="text-gray-700 leading-relaxed mb-3">
                {review.comment}
              </p>
            )}

            {/* Media Attachments */}
            {review.mediaUrls && review.mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {review.mediaUrls.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Review attachment ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer border border-gray-300 hover:border-[#b8860b] transition-colors"
                        onClick={() => window.open(media.url, '_blank')}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#b8860b] transition-colors">
                        <FaUserCircle className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Admin Response */}
            {review.adminResponse && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 font-semibold text-sm mb-1">Admin Response:</p>
                <p className="text-blue-700 text-sm">{review.adminResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center mt-24">
      <div className="text-[#b8860b] text-xl">Loading product details...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center mt-24">
      <div className="text-red-600 text-xl">Error: {error}</div>
      <button 
        onClick={() => window.location.reload()} 
        className="ml-4 bg-[#b8860b] text-white px-4 py-2 rounded"
      >
        Retry
      </button>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center mt-24">
      <div className="text-red-600 text-xl">Product not found.</div>
      <button 
        onClick={() => navigate('/products')} 
        className="ml-4 bg-[#b8860b] text-white px-4 py-2 rounded"
      >
        Back to Products
      </button>
    </div>
  );

  // UPDATED: Use hook's isInWishlist function directly
  const isProductInWishlist = isInWishlist(product._id);
  const productImages = getProductImages(product);
  const productPrice = product.price || 0;
  const productStock = product.stock || product.inventoryCount || 10;

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-[#b8860b] mb-6 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image with Zoom */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div 
                className="relative overflow-hidden rounded-lg bg-gray-100"
                style={{ height: '400px' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={resetZoom}
              >
                {productImages.length > 0 ? (
                  <img 
                    src={productImages[selectedImage]} 
                    alt={product.name}
                    className={`w-full h-full object-contain transition-transform duration-200 ${
                      isZooming ? 'cursor-move' : 'cursor-zoom-in'
                    }`}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: `${position.x}% ${position.y}%`
                    }}
                    onClick={() => !isZooming && handleZoomIn()}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
                
                {/* Zoom Controls */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <button
                    onClick={handleZoomIn}
                    className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    title="Zoom In"
                  >
                    <FaSearchPlus className="text-gray-700" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    title="Zoom Out"
                  >
                    <FaSearchMinus className="text-gray-700" />
                  </button>
                </div>
                
                {/* Zoom Level Indicator */}
                {zoomLevel > 1 && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.map((image, index) => (
                  <button
                    key={`thumbnail-${product._id}-${index}`}
                    onClick={() => {
                      setSelectedImage(index);
                      resetZoom();
                    }}
                    className={`bg-white rounded-lg p-2 border-2 transition-all ${
                      selectedImage === index ? 'border-[#b8860b]' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-16 object-cover rounded"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>
              
              {/* Rating and Price - UPDATED: Use calculated values */}
              <div className="flex items-center justify-between mb-4">
                {calculatedAverageRating > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {renderStars(calculatedAverageRating, 'w-5 h-5', `product-${product._id}`)}
                    </div>
                    <span className="text-gray-600 text-sm">
                      {calculatedAverageRating.toFixed(1)} ({calculatedTotalReviews} reviews)
                    </span>
                  </div>
                )}
                
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#b8860b]">
                    {formatPrice(productPrice)}
                  </span>
                  {product.originalPrice && product.originalPrice > productPrice && (
                    <span className="text-lg text-gray-500 line-through ml-2">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-4">
                {productStock > 0 ? (
                  <span className="text-green-600 font-medium">
                    ✓ In Stock ({productStock} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Combined Description & Features */}
            {(product.description || product.features || product.material) && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Product Details</h3>
                
                {product.description && (
                  <p className="text-gray-700 mb-3">{product.description}</p>
                )}
                
                {product.features && product.features.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-800 mb-2">Features:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      {product.features.map((feature, index) => (
                        <li key={`feature-${product._id}-${index}`}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {product.material && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Materials:</h4>
                    <p className="text-gray-700 text-sm">{product.material}</p>
                  </div>
                )}
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <span className="font-medium text-gray-800">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="px-3 py-2 text-gray-600 hover:text-[#b8860b] transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x text font-semibold min-w-[50px] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="px-3 py-2 text-gray-600 hover:text-[#b8860b] transition-colors disabled:opacity-50"
                    disabled={quantity >= productStock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!productStock || productStock === 0}
                  className="flex-1 bg-[#b8860b] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#997500] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-md"
                >
                  <FaShoppingCart className="mr-2" />
                  Add to Cart ({quantity})
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className={`p-3 rounded-lg border transition-colors disabled:opacity-50 ${
                      isProductInWishlist
                        ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100'
                        : 'border-gray-300 text-gray-600 hover:border-[#b8860b] hover:text-[#b8860b] hover:bg-gray-50'
                    }`}
                    title={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isProductInWishlist ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                  </button>

                  <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:border-[#b8860b] hover:text-[#b8860b] hover:bg-gray-50 transition-colors"
                    title="Share product"
                  >
                    <FaShare size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Product Info */}
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">SKU:</span>
                <span className="font-medium ml-1">{product.sku || product._id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="font-medium ml-1">{product.category || 'Uncategorized'}</span>
              </div>
              <div>
                <span className="text-gray-600">Brand:</span>
                <span className="font-medium ml-1">{product.brand || 'Generic'}</span>
              </div>
              {product.color && (
                <div>
                  <span className="text-gray-600">Color:</span>
                  <span className="font-medium ml-1">{product.color}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <div className="mb-8">
            <ReviewForm 
              productId={productId} 
              onReviewSubmit={handleReviewSubmit} 
            />
          </div>

          {/* Simple Review Display */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <SimpleReviewDisplay />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={`related-${relatedProduct._id}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => navigate(`/products/${relatedProduct._id}`)}
                >
                  <img
                    src={getProductImages(relatedProduct)[0]}
                    alt={relatedProduct.name}
                    className="w-full h-32 object-cover"
                    onError={handleImageError}
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{relatedProduct.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-[#b8860b] font-bold">
                        {formatPrice(relatedProduct.price || 0)}
                      </p>
                      {relatedProduct.rating && (
                        <div className="flex items-center">
                          {renderStars(relatedProduct.rating, 'w-3 h-3', `related-${relatedProduct._id}`)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}