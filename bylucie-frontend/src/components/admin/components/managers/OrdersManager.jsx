import React, { useState } from 'react';

const OrdersManager = ({ orders, onUpdateOrderStatus, onRefreshOrders }) => {
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Format date without external library
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get customer name with guest support
  const getCustomerName = (order) => {
    if (order.guestCustomer?.fullName) {
      return `${order.guestCustomer.fullName} (Guest)`;
    }
    if (order.user?.firstName || order.user?.lastName) {
      return `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
    }
    if (order.user?.email) {
      return order.user.email;
    }
    return 'Unknown Customer';
  };

  // Get customer email with guest support
  const getCustomerEmail = (order) => {
    if (order.guestCustomer?.email) {
      return order.guestCustomer.email;
    }
    if (order.user?.email) {
      return order.user.email;
    }
    return 'No email';
  };

  // Get customer phone with guest support
  const getCustomerPhone = (order) => {
    if (order.guestCustomer?.phone) {
      return order.guestCustomer.phone;
    }
    return 'No phone';
  };

  // Get customer address with guest support
  const getCustomerAddress = (order) => {
    if (order.guestCustomer?.address) {
      return order.guestCustomer.address;
    }
    if (order.shippingAddress) {
      return `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.country || ''}`.trim().replace(/^,\s*/, '');
    }
    return 'No address';
  };

  // Get order type
  const getOrderType = (order) => {
    if (order.guestCustomer) {
      return 'Guest Order';
    }
    if (order.user) {
      return 'User Order';
    }
    return 'Unknown';
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await onUpdateOrderStatus(orderId, newStatus);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeColor = (order) => {
    if (order.guestCustomer) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (order.totalAmount) return order.totalAmount;
    if (order.products) {
      return order.products.reduce((total, item) => {
        const price = item.productPrice || item.price || 0;
        const quantity = item.quantity || 1;
        return total + (price * quantity);
      }, 0);
    }
    return 0;
  };

  // Get product name
  const getProductName = (product) => {
    if (typeof product === 'string') return product;
    if (product.productName) return product.productName;
    if (product.name) return product.name;
    if (product.product?.name) return product.product.name;
    return 'Unknown Product';
  };

  // Get product price
  const getProductPrice = (product) => {
    if (product.productPrice) return product.productPrice;
    if (product.price) return product.price;
    if (product.product?.price) return product.product.price;
    return 0;
  };

  // Get order statistics
  const getOrderStats = () => {
    const guestOrders = orders.filter(o => o.guestCustomer);
    const userOrders = orders.filter(o => o.user && !o.guestCustomer);
    
    return {
      total: orders.length,
      guest: guestOrders.length,
      user: userOrders.length
    };
  };

  const stats = getOrderStats();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Orders Management</h3>
            <p className="text-gray-600 mt-1">
              Total: {stats.total} orders • 
              Guest Orders: {stats.guest} • 
              User Orders: {stats.user}
            </p>
          </div>
          <button
            onClick={onRefreshOrders}
            className="bg-[#b8860b] text-white px-4 py-2 rounded-lg hover:bg-[#997500] transition-colors"
          >
            Refresh Orders
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-gray-200">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-lg">No orders found</p>
            <p className="text-sm">Orders will appear here when customers place them</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id || order.id} className="p-6 hover:bg-gray-50 transition-colors">
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Order #{order.orderNumber || order._id?.slice(-8) || 'N/A'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeColor(order)}`}>
                      {getOrderType(order)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Customer:</strong> {getCustomerName(order)}
                    </div>
                    <div>
                      <strong>Email:</strong> {getCustomerEmail(order)}
                    </div>
                    <div>
                      <strong>Phone:</strong> {getCustomerPhone(order)}
                    </div>
                    <div>
                      <strong>Date:</strong> {formatDate(order.createdAt)}
                    </div>
                    <div>
                      <strong>Total:</strong> KSH {calculateOrderTotal(order).toFixed(2)}
                    </div>
                    <div>
                      <strong>Items:</strong> {order.products?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleOrderExpansion(order._id || order.id)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {expandedOrder === (order._id || order.id) ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrder === (order._id || order.id) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Customer Information */}
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Customer Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Name:</strong> {getCustomerName(order)}
                      </div>
                      <div>
                        <strong>Email:</strong> {getCustomerEmail(order)}
                      </div>
                      <div>
                        <strong>Phone:</strong> {getCustomerPhone(order)}
                      </div>
                      <div>
                        <strong>Order Type:</strong> {getOrderType(order)}
                      </div>
                      {getCustomerAddress(order) !== 'No address' && (
                        <div className="md:col-span-2">
                          <strong>Address:</strong> {getCustomerAddress(order)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Order Items</h5>
                    <div className="space-y-2">
                      {order.products?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium">{getProductName(item)}</div>
                            <div className="text-sm text-gray-600">
                              Qty: {item.quantity} × KSH {getProductPrice(item).toFixed(2)}
                            </div>
                          </div>
                          <div className="font-semibold">
                            KSH {(getProductPrice(item) * (item.quantity || 1)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300 font-semibold">
                      <span>Total:</span>
                      <span>KSH {calculateOrderTotal(order).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Order Metadata */}
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Order Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Order ID:</strong> {order._id || order.id}
                      </div>
                      <div>
                        <strong>Order Number:</strong> {order.orderNumber || 'N/A'}
                      </div>
                      <div>
                        <strong>Created:</strong> {formatDate(order.createdAt)}
                      </div>
                      <div>
                        <strong>Updated:</strong> {formatDate(order.updatedAt)}
                      </div>
                      {order.deliveryOption && (
                        <div>
                          <strong>Delivery:</strong> {order.deliveryOption}
                        </div>
                      )}
                      {order.paymentMethod && (
                        <div>
                          <strong>Payment:</strong> {order.paymentMethod}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Update Status:</span>
                    <select
                      value={order.status || ''}
                      onChange={(e) => handleStatusUpdate(order._id || order.id, e.target.value)}
                      disabled={updatingOrder === (order._id || order.id)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {updatingOrder === (order._id || order.id) && (
                      <div className="text-sm text-gray-500">Updating...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersManager;