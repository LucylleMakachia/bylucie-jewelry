import React, { useState, useEffect, useContext, useMemo } from "react";
import { HiOutlineAdjustments } from "react-icons/hi";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaStar, FaRegStar } from "react-icons/fa";
import { CartContext } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useWishlist } from '../hooks/useWishlist';

const PRODUCTS_PER_PAGE = 9;

// Consistent star rating component used across all files
const renderStars = (rating) => {
  return Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    return starValue <= rating ? (
      <FaStar key={starValue} className="w-4 h-4 text-yellow-400" />
    ) : (
      <FaRegStar key={starValue} className="w-4 h-4 text-gray-300" />
    );
  });
};

export default function Products({ products, getToken, showToast, user }) {
  const { addItem } = useContext(CartContext);
  const { formatPrice } = useCurrency();

  // UPDATED: Use the enhanced wishlist hook
  const { 
    toggleWishlist, 
    isInWishlist, 
    loading: wishlistLoading 
  } = useWishlist(getToken, showToast, user);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 14500]);
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [selectedMaterials, setSelectedMaterials] = useState(new Set());
  const [selectedColors, setSelectedColors] = useState(new Set());
  const [sortOption, setSortOption] = useState("name-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProductImage = (product) => {
    if (!product) return "/images/placeholder.jpg";

    if (product.imageUrl) {
      return product.imageUrl;
    }

    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === "object" && firstImage.url) {
        return firstImage.url;
      }
      if (typeof firstImage === "string") {
        return firstImage;
      }
    }

    return "/images/placeholder.jpg";
  };

  const handleImageError = (e) => {
    e.target.src = "/images/placeholder.jpg";
    e.target.alt = "Image not available";
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchInput,
    categoryFilter,
    priceRange,
    selectedTypes,
    selectedMaterials,
    selectedColors,
    sortOption,
  ]);

  // Dynamically adjust price range
  useEffect(() => {
    if (products.length > 0) {
      const maxPrice = Math.max(0, ...products.map((p) => p.price || 0));
      setPriceRange([0, maxPrice]);
    }
  }, [products]);

  useEffect(() => setShowFilters(false), [currentPage]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;

      if (
        searchInput.trim() !== "" &&
        !p.name?.toLowerCase().includes(searchInput.toLowerCase())
      )
        return false;

      const productPrice = p.price || 0;
      if (productPrice < priceRange[0] || productPrice > priceRange[1]) return false;

      if (selectedTypes.size > 0 && !selectedTypes.has(p.category)) return false;
      if (selectedMaterials.size > 0 && !selectedMaterials.has(p.material)) return false;
      if (selectedColors.size > 0 && !selectedColors.has(p.color)) return false;

      return true;
    });
  }, [
    products,
    categoryFilter,
    searchInput,
    priceRange,
    selectedTypes,
    selectedMaterials,
    selectedColors,
  ]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA = a.price || 0;
      const priceB = b.price || 0;

      switch (sortOption) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });
  }, [filteredProducts, sortOption]);

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const displayedProducts = sortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const toggleType = (type) =>
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) newSet.delete(type);
      else newSet.add(type);
      return newSet;
    });

  const toggleMaterial = (mat) =>
    setSelectedMaterials((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mat)) newSet.delete(mat);
      else newSet.add(mat);
      return newSet;
    });

  const toggleColor = (color) =>
    setSelectedColors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(color)) newSet.delete(color);
      else newSet.add(color);
      return newSet;
    });

  const clearFilters = () => {
    setSearchInput("");
    setCategoryFilter("All");
    if (products.length > 0) {
      const maxPrice = Math.max(0, ...products.map((p) => p.price || 0));
      setPriceRange([0, maxPrice]);
    }
    setSelectedTypes(new Set());
    setSelectedMaterials(new Set());
    setSelectedColors(new Set());
    setSortOption("name-asc");
    setCurrentPage(1);
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  // UPDATED: Use the hook's toggle function
  const handleWishlistToggle = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center p-6 text-[#b8860b]">Loading products...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center p-6 text-red-600">
          Error loading products: {error}
        </p>
      </div>
    );

  return (
    <main className="bg-white min-h-screen p-6 md:p-12 font-serif text-[#002200] relative max-w-[1240px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-wide">Our Products</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-[#b8860b] hover:text-[#ff8c00] transition-colors"
        >
          <HiOutlineAdjustments className="mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-lg border border-gray-200">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent"
              >
                <option>All</option>
                <option>Jewelry</option>
                <option>Decor</option>
                <option>Fashion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Sort By
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent"
              >
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="price-asc">Price (Low–High)</option>
                <option value="price-desc">Price (High–Low)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={clearFilters}
                className="bg-[#b8860b] text-white rounded-lg p-3 hover:bg-[#997500] transition-colors font-semibold"
              >
                Clear All Filters
              </button>
              <div className="text-sm text-gray-600 text-center">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>
          </div>
        </div>
      )}

      {displayedProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">
            No products found matching your criteria.
          </p>
          <button
            onClick={clearFilters}
            className="bg-[#b8860b] text-white px-6 py-2 rounded-lg hover:bg-[#997500] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedProducts.map((p) => {
              const key = p._id || `${p.name}-${Math.random()}`; // unique fallback
              const isWishlisted = isInWishlist(p._id);
              const productImage = getProductImage(p);

              return (
                <div
                  key={key}
                  className="border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 relative bg-white group"
                >
                  <button
                    onClick={(e) => handleWishlistToggle(p._id, e)}
                    disabled={wishlistLoading}
                    className="absolute top-4 right-4 text-[#b8860b] text-xl bg-white p-2 rounded-full shadow-lg hover:text-[#ff8c00] transition-colors z-10 disabled:opacity-50"
                    title={
                      isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                    }
                  >
                    {isWishlisted ? <FaHeart /> : <FaRegHeart />}
                  </button>

                  <Link to={`/products/${p._id}`} className="block">
                    <img
                      src={productImage}
                      alt={p.name || "Product image"}
                      className="w-full h-64 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform duration-300"
                      onError={handleImageError}
                    />
                    <div className="mt-3">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {p.name || "Unnamed Product"}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {p.category || "Uncategorized"}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xl text-[#b8860b]">
                          {formatPrice(p.price || 0)}
                        </span>
                        <div className="flex items-center space-x-1">
                          {renderStars(p.rating || 0)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        ({p.reviewCount || 0} reviews)
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => handleAddToCart(p, e)}
                    className="mt-4 w-full bg-[#b8860b] text-white py-3 rounded-lg hover:bg-[#997500] transition-colors font-semibold shadow-md"
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-12 space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === i + 1
                      ? "bg-[#b8860b] text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}