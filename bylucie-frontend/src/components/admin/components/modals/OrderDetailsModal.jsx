import React from 'react';
import { FaBox, FaUser, FaMapMarkerAlt, FaCreditCard, FaCalendar } from 'react-icons/fa';

function OrderDetailsModal({ visible, order, onClose, onUpdateStatus }) {
  if (!visible || !order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleStatusChange = (newStatus) => {
    if (onUpdateStatus && newStatus !== order.status) {
      onUpdateStatus(order._id || order.id, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scale-in border border-gray-100">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b8860b] to-[#daa520] bg-clip-text text-transparent">
                Order Details
              </h2>
              <p className="text-gray-600 mt-1">Order #{order.orderNumber || order._id?.slice(-8)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors transform hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <FaBox className="text-[#b8860b]" />
                  Order Status
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(order.status)}`}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.products?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        {item.image && (
                          <img
                            src={typeof item.image === 'string' ? item.image : item.image.url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-[#b8860b]">KES {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-2xl text-[#b8860b]">KES {order.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Customer & Shipping */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <FaUser className="text-[#b8860b]" />
                  Customer
                </h3>
                <div className="space-y-3">
                  <p><strong>Name:</strong> {order.customerName}</p>
                  <p><strong>Email:</strong> {order.customerEmail}</p>
                  <p><strong>Phone:</strong> {order.customerPhone || 'N/A'}</p>
                  {order.userId && (
                    <p className="text-sm text-gray-600">User ID: {order.userId}</p>
                  )}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <FaMapMarkerAlt className="text-[#b8860b]" />
                  Shipping
                </h3>
                <div className="space-y-3">
                  <p><strong>Address:</strong> {order.shippingAddress?.address}</p>
                  {order.shippingAddress?.city && (
                    <p><strong>City:</strong> {order.shippingAddress.city}</p>
                  )}
                  {order.shippingAddress?.postalCode && (
                    <p><strong>Postal Code:</strong> {order.shippingAddress.postalCode}</p>
                  )}
                  {order.shippingAddress?.country && (
                    <p><strong>Country:</strong> {order.shippingAddress.country}</p>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <FaCalendar className="text-[#b8860b]" />
                  Timeline
                </h3>
                <div className="space-y-3 text-sm">
                  <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
                  {order.updatedAt && order.updatedAt !== order.createdAt && (
                    <p><strong>Last Updated:</strong> {formatDate(order.updatedAt)}</p>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              {order.paymentMethod && (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                    <FaCreditCard className="text-[#b8860b]" />
                    Payment
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Method:</strong> {order.paymentMethod}</p>
                    {order.paymentStatus && (
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-sm"
            >
              Close
            </button>
            <button
              onClick={() => handleStatusChange('delivered')}
              disabled={order.status === 'delivered'}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark as Delivered
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;