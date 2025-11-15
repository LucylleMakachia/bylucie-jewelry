import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaSave,
  FaTimes,
  FaSignOutAlt,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaCamera,
  FaUserCircle,
  FaShieldAlt,
  FaCalendarAlt,
} from 'react-icons/fa';
import { CartContext } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useWishlist } from "../hooks/useWishlist"; 

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <svg
        key={`full-${i}`}
        className="w-4 h-4 text-[#ff8c00]"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.39 2.455a1 1 0 00-.363 1.118l1.287 3.966c.3.92-.755 1.688-1.54 1.118l-3.39-2.454a1 1 0 00-1.176 0l-3.39 2.454c-.784.57-1.838-.197-1.54-1.118l1.287-3.966a1 1 0 00-.363-1.118L2.047 9.392c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.965z" />
      </svg>
    );
  }
  if (halfStar) {
    stars.push(
      <svg
        key="half"
        className="w-4 h-4 text-[#ff8c00]"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 15.27l-5.18 3.09 1.19-6.9L.5 6.91l6.91-1L10 0l2.59 5.91 6.91 1-5 4.56 1.19 6.9L10 15.27z" />
      </svg>
    );
  }
  for (let i = stars.length; i < 5; i++) {
    stars.push(
      <svg
        key={`empty-${i}`}
        className="w-4 h-4 text-gray-300"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.39 2.455a1 1 0 00-.363 1.118l1.287 3.966c.3.92-.755 1.688-1.54 1.118l-3.39-2.454a1 1 0 00-1.176 0l-3.39 2.454c-.784.57-1.838-.197-1.54-1.118l1.287-3.966a1 1 0 00-.363-1.118L2.047 9.392c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.965z" />
      </svg>
    );
  }
  return <div className="flex items-center space-x-1">{stars}</div>;
};

const getProductImage = (product) => {
  if (product.imageUrl) {
    return product.imageUrl;
  }
  
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    if (typeof firstImage === 'object' && firstImage.url) {
      return firstImage.url;
    }
    if (typeof firstImage === 'string') {
      return firstImage;
    }
  }
  
  return '/images/placeholder.jpg';
};

const handleImageError = (e) => {
  e.target.src = '/images/placeholder.jpg';
  e.target.alt = 'Image not available';
};

export default function Profile({ products, getToken, showToast, user }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { addItem } = React.useContext(CartContext);
  const { formatPrice } = useCurrency();
  
  // UPDATED: Use enhanced wishlist hook with detailedWishlist
  const { 
    wishlist, 
    detailedWishlist,
    removeFromWishlist, 
    loading: wishlistLoading 
  } = useWishlist(getToken, showToast, user);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (clerkUser) {
      setFormData({
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        username: clerkUser.username || '',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
      });
    }
  }, [clerkUser]);

  // UPDATED: Use detailedWishlist when available, fallback to filtering products
  const wishlistProducts = detailedWishlist.length > 0 
    ? detailedWishlist.map(item => ({
        _id: item.productId,
        name: item.name,
        price: item.price,
        imageUrl: item.image,
        category: item.category,
        rating: 0, // Default values for compatibility
        reviewCount: 0
      }))
    : products.filter(product => wishlist.includes(product._id));

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
    setResendSuccess('');
    setResendError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      username: clerkUser.username || '',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
    });
    setError('');
    setSuccess('');
    setResendSuccess('');
    setResendError('');
  };

  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setResendSuccess('');
    setResendError('');
    try {
      await clerkUser.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username || undefined,
      });
      await clerkUser.primaryEmailAddress?.update({ emailAddress: formData.email });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!clerkUser?.primaryEmailAddress) return;
    setResendLoading(true);
    setResendError('');
    setResendSuccess('');
    try {
      await clerkUser.primaryEmailAddress.prepareVerification({ strategy: 'email_code' });
      setResendSuccess('Verification email resent successfully.');
    } catch (err) {
      setResendError('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // UPDATED: Use hook's remove function
  const handleRemoveFromWishlist = async (productId) => {
    await removeFromWishlist(productId);
  };

  const addToCartFromWishlist = (product) => {
    addItem(product);
  };

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto mt-24 p-8 text-center text-[#b8860b] text-xl">
        Loading...
      </div>
    );
  }

  if (!clerkUser) {
    navigate('/sign-in');
    return null;
  }

  const getInitials = () => {
    const first = clerkUser.firstName ? clerkUser.firstName[0] : '';
    const last = clerkUser.lastName ? clerkUser.lastName[0] : '';
    return `${first}${last}` || 'U';
  };

  return (
    <div className="max-w-7xl mx-auto mt-24 p-8">
      {/* Header Section - Removed Gradient */}
      <div className="bg-[#f8f5f0] rounded-t-2xl p-12 border border-[#b8860b]">
        <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
          {/* Profile Photo Section */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center border-4 border-[#b8860b] shadow-lg">
              {clerkUser.hasImage ? (
                <img
                  src={clerkUser.imageUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="text-5xl font-bold text-[#b8860b]">
                  {getInitials()}
                </div>
              )}
            </div>
            <button className="absolute bottom-4 right-4 bg-[#002200] p-3 rounded-full shadow-lg hover:bg-[#001a00] transition-colors">
              <FaCamera className="text-white text-lg" />
            </button>
          </div>

          {/* Welcome Section */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl font-serif font-bold text-[#002200] mb-4">
              Welcome back, {clerkUser.firstName || 'Valued Customer'}!
            </h1>
            <p className="text-gray-700 text-xl mb-8">
              Manage your profile and track your favorite items
            </p>
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              <div className="bg-white px-6 py-4 rounded-xl border border-[#b8860b] shadow-sm">
                <div className="text-2xl font-bold text-[#b8860b]">{wishlist.length}</div>
                <div className="text-gray-600">Wishlisted Items</div>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl border border-[#b8860b] shadow-sm">
                <div className="text-2xl font-bold text-[#b8860b]">
                  {new Date(clerkUser.createdAt).getFullYear()}
                </div>
                <div className="text-gray-600">Member Since</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Increased Spacing */}
      <div className="bg-white border-x border-gray-200">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-4 px-10 py-8 font-semibold text-xl transition-colors whitespace-nowrap border-b-2 min-w-0 flex-1 justify-center ${
              activeTab === 'profile'
                ? 'text-[#b8860b] border-[#b8860b] bg-[#fffaf0]'
                : 'text-gray-600 hover:text-[#b8860b] border-transparent hover:bg-gray-50'
            }`}
          >
            <FaUserCircle className="text-2xl" />
            <span>Profile Information</span>
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center space-x-4 px-10 py-8 font-semibold text-xl transition-colors whitespace-nowrap border-b-2 min-w-0 flex-1 justify-center relative ${
              activeTab === 'wishlist'
                ? 'text-[#b8860b] border-[#b8860b] bg-[#fffaf0]'
                : 'text-gray-600 hover:text-[#b8860b] border-transparent hover:bg-gray-50'
            }`}
          >
            <FaHeart className="text-2xl" />
            <span>My Wishlist</span>
            {wishlist.length > 0 && (
              <span className="absolute top-4 right-8 bg-[#ff8c00] text-white text-sm rounded-full w-8 h-8 flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-b-2xl shadow-lg border border-gray-200 border-t-0">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-8 mx-8 mt-8 rounded-lg">
            <div className="flex items-center">
              <FaShieldAlt className="text-red-400 mr-4 text-xl" />
              <p className="text-red-700 text-lg">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-8 mx-8 mt-8 rounded-lg">
            <div className="flex items-center">
              <FaSave className="text-green-400 mr-4 text-xl" />
              <p className="text-green-700 text-lg">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Tab Content - Expanded Areas */}
        {activeTab === 'profile' && (
          <div className="p-12">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-serif font-semibold text-gray-800">Personal Information</h2>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-4 bg-[#b8860b] text-white hover:bg-[#997500] px-8 py-4 rounded-xl transition font-semibold shadow-lg text-lg"
                >
                  <FaEdit className="text-xl" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {/* Left Column - Personal Details */}
              <div className="space-y-8">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                  <label className="block text-lg font-semibold text-gray-700 mb-6 uppercase tracking-wide">
                    Basic Information
                  </label>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="flex items-center text-gray-800 font-semibold mb-4 text-lg">
                        <FaUser className="mr-4 text-[#ff8c00] text-xl" />
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20 transition"
                          disabled={loading}
                          placeholder="Enter first name"
                        />
                      ) : (
                        <p className="text-xl text-gray-800 bg-white p-4 rounded-xl border border-gray-200 min-h-[60px] flex items-center">
                          {clerkUser.firstName || 'Not set'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center text-gray-800 font-semibold mb-4 text-lg">
                        <FaUser className="mr-4 text-[#ff8c00] text-xl" />
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20 transition"
                          disabled={loading}
                          placeholder="Enter last name"
                        />
                      ) : (
                        <p className="text-xl text-gray-800 bg-white p-4 rounded-xl border border-gray-200 min-h-[60px] flex items-center">
                          {clerkUser.lastName || 'Not set'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center text-gray-800 font-semibold mb-4 text-lg">
                        <FaUser className="mr-4 text-[#ff8c00] text-xl" />
                        Username
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20 transition"
                          disabled={loading}
                          placeholder="Choose a username"
                        />
                      ) : (
                        <p className="text-xl text-gray-800 bg-white p-4 rounded-xl border border-gray-200 min-h-[60px] flex items-center">
                          {clerkUser.username || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact & Account Details */}
              <div className="space-y-8">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                  <label className="block text-lg font-semibold text-gray-700 mb-6 uppercase tracking-wide">
                    Contact Information
                  </label>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="flex items-center text-gray-800 font-semibold mb-4 text-lg">
                        <FaEnvelope className="mr-4 text-[#ff8c00] text-xl" />
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20 transition"
                          disabled={loading}
                          placeholder="Enter email address"
                        />
                      ) : (
                        <p className="text-xl text-gray-800 bg-white p-4 rounded-xl border border-gray-200 min-h-[60px] flex items-center">
                          {clerkUser.primaryEmailAddress?.emailAddress || 'Not set'}
                        </p>
                      )}
                      {clerkUser.primaryEmailAddress?.verification?.status === 'verified' ? (
                        <div className="mt-4 flex items-center space-x-3">
                          <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-lg font-semibold">
                            ✓ Verified Email
                          </span>
                        </div>
                      ) : (
                        <div className="mt-6 space-y-4">
                          <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-lg font-semibold">
                            Email Not Verified
                          </span>
                          <button
                            type="button"
                            disabled={resendLoading}
                            onClick={handleResendVerification}
                            className="block text-lg text-[#b8860b] font-semibold hover:text-[#997500] transition"
                          >
                            {resendLoading ? 'Sending verification email...' : 'Resend Verification Email'}
                          </button>
                          {resendSuccess && (
                            <p className="text-green-600 text-lg mt-2 font-semibold">{resendSuccess}</p>
                          )}
                          {resendError && (
                            <p className="text-red-600 text-lg mt-2 font-semibold">{resendError}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {clerkUser.primaryPhoneNumber && (
                      <div>
                        <label className="flex items-center text-gray-800 font-semibold mb-4 text-lg">
                          <FaPhone className="mr-4 text-[#ff8c00] text-xl" />
                          Phone Number
                        </label>
                        <p className="text-xl text-gray-800 bg-white p-4 rounded-xl border border-gray-200 min-h-[60px] flex items-center">
                          {clerkUser.primaryPhoneNumber.phoneNumber}
                        </p>
                        <div className="mt-4">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${
                            clerkUser.primaryPhoneNumber.verification?.status === 'verified' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {clerkUser.primaryPhoneNumber.verification?.status === 'verified' ? '✓ Verified Phone' : 'Phone Not Verified'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Information - More Spacious */}
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                  <label className="block text-lg font-semibold text-gray-700 mb-6 uppercase tracking-wide">
                    Account Information
                  </label>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-4 text-[#ff8c00] text-xl" />
                        <span className="font-semibold text-gray-700 text-lg">Member Since</span>
                      </div>
                      <span className="text-gray-800 text-lg">
                        {new Date(clerkUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-center">
                        <FaShieldAlt className="mr-4 text-[#ff8c00] text-xl" />
                        <span className="font-semibold text-gray-700 text-lg">Account Status</span>
                      </div>
                      <span className="text-green-600 font-semibold text-lg">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-center space-x-6 pt-12 mt-12 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-4 bg-[#b8860b] text-white hover:bg-[#997500] px-10 py-5 rounded-xl transition font-semibold shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave className="text-xl" />
                  <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center space-x-4 bg-gray-500 text-white hover:bg-gray-600 px-10 py-5 rounded-xl transition font-semibold shadow-lg text-lg disabled:opacity-50"
                >
                  <FaTimes className="text-xl" />
                  <span>Cancel</span>
                </button>
              </div>
            )}

            {/* Sign Out Button */}
            <div className="mt-16 pt-12 border-t border-gray-200 text-center">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center space-x-4 border-2 border-red-500 bg-white text-red-500 hover:bg-red-500 hover:text-white px-10 py-5 rounded-xl transition font-semibold text-lg"
              >
                <FaSignOutAlt className="text-xl" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Wishlist Tab Content */}
        {activeTab === 'wishlist' && (
          <div className="p-12">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-serif font-semibold text-gray-800">My Wishlist</h2>
                <p className="text-gray-600 mt-4 text-xl">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                </p>
              </div>
              {wishlist.length > 0 && (
                <button
                  onClick={() => navigate('/products')}
                  className="flex items-center space-x-4 border border-[#b8860b] bg-white text-[#b8860b] hover:bg-[#b8860b] hover:text-white px-8 py-4 rounded-xl transition font-semibold text-lg"
                >
                  <FaShoppingCart className="text-xl" />
                  <span>Continue Shopping</span>
                </button>
              )}
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="text-center py-20">
                <FaRegHeart className="mx-auto text-9xl text-gray-300 mb-8" />
                <h3 className="text-3xl font-semibold text-gray-600 mb-6">Your wishlist is empty</h3>
                <p className="text-gray-500 mb-12 text-xl max-w-2xl mx-auto leading-relaxed">
                  Discover amazing products and add them to your wishlist to save them for later. Your wishlist helps you keep track of items you love.
                </p>
                <button
                  onClick={() => navigate('/products')}
                  className="bg-[#b8860b] text-white hover:bg-[#997500] px-12 py-6 rounded-xl transition font-semibold text-xl shadow-lg"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {wishlistProducts.map((product) => {
                  const productImage = getProductImage(product);
                  
                  return (
                    <div
                      key={product._id}
                      className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 p-8 relative group"
                    >
                      <button
                        onClick={() => handleRemoveFromWishlist(product._id)}
                        disabled={wishlistLoading}
                        className="absolute top-6 right-6 text-[#b8860b] text-2xl bg-white p-4 rounded-full shadow-xl hover:text-red-500 hover:bg-red-50 transition-all z-10 disabled:opacity-50"
                        title="Remove from wishlist"
                      >
                        <FaHeart />
                      </button>
                      
                      <div 
                        className="cursor-pointer mb-6 overflow-hidden rounded-xl"
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-full h-72 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                          onError={handleImageError}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 
                          className="font-semibold text-2xl cursor-pointer hover:text-[#b8860b] transition-colors line-clamp-2 leading-tight"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          {product.name || 'Unnamed Product'}
                        </h3>
                        <p className="text-gray-500 text-lg uppercase tracking-wide font-semibold">
                          {product.category || 'Uncategorized'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-3xl text-[#b8860b]">
                            {formatPrice(product.price || 0)}
                          </span>
                          <div className="flex items-center space-x-2">
                            {renderStars(product.rating || 0)}
                            <span className="text-lg text-gray-500 ml-2">
                              ({product.reviewCount || 0})
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => addToCartFromWishlist(product)}
                        className="mt-8 w-full flex items-center justify-center space-x-4 bg-[#b8860b] text-white py-5 rounded-xl hover:bg-[#997500] transition font-semibold shadow-lg text-lg"
                      >
                        <FaShoppingCart className="text-xl" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}