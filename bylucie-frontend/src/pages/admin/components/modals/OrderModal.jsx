import React, { useState, useEffect } from 'react';

function OrderModal({ visible, onClose, onSubmit, products }) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1 }]);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const deliveryOptions = [
    { id: 'pickup', name: 'Store Pickup', cost: 0, description: 'Pick up from our store' },
    { id: 'pickupmtaani', name: 'PickupMtaani', cost: 300, description: 'Same-day delivery' },
    { id: 'bolt', name: 'Bolt Delivery', cost: 350, description: 'Fast courier service' },
    { id: 'uber', name: 'Uber Delivery', cost: 400, description: 'Express delivery' }
  ];

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setCustomerName('');
      setCustomerEmail('');
      setShippingAddress('');
      setOrderItems([{ productId: '', quantity: 1 }]);
      setDeliveryMethod('pickup');
      setDeliveryNotes('');
    }
  }, [visible]);

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1 }]);
  };

  const removeOrderItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.productId));
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    
    const selectedDelivery = deliveryOptions.find(opt => opt.id === deliveryMethod);
    return subtotal + (selectedDelivery?.cost || 0);
  };

  const calculateEstimatedDelivery = (method) => {
    const now = new Date();
    switch (method) {
      case 'pickup':
        return new Date(now.setHours(now.getHours() + 2)).toISOString();
      case 'pickupmtaani':
        return new Date(now.setHours(now.getHours() + 4)).toISOString();
      case 'bolt':
        return new Date(now.setHours(now.getHours() + 3)).toISOString();
      case 'uber':
        return new Date(now.setHours(now.getHours() + 2)).toISOString();
      default:
        return new Date(now.setHours(now.getHours() + 24)).toISOString();
    }
  };

  const handleSubmit = () => {
    if (!customerName || !customerEmail || !shippingAddress) {
      alert('Please fill in all customer details');
      return;
    }

    if (deliveryMethod !== 'pickup' && !shippingAddress.trim()) {
      alert('Please provide a shipping address for delivery');
      return;
    }

    // Calculate total and validate items
    let subtotal = 0;
    const validItems = [];

    for (const item of orderItems) {
      if (!item.productId || item.quantity < 1) {
        alert('Please fill in all order items correctly');
        return;
      }

      const product = products.find(p => p.id === parseInt(item.productId));
      if (!product) {
        alert('Invalid product selected');
        return;
      }

      if (item.quantity > product.stock) {
        alert(`Not enough stock for ${product.name}. Available: ${product.stock}`);
        return;
      }

      validItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      subtotal += product.price * item.quantity;
    }

    const selectedDelivery = deliveryOptions.find(opt => opt.id === deliveryMethod);
    const total = subtotal + (selectedDelivery?.cost || 0);

    const newOrder = {
      customerName,
      customerEmail,
      shippingAddress,
      items: validItems,
      total,
      status: 'Pending',
      delivery: {
        method: deliveryMethod,
        cost: selectedDelivery?.cost || 0,
        trackingNumber: '',
        estimatedDelivery: calculateEstimatedDelivery(deliveryMethod),
        status: 'pending',
        address: shippingAddress,
        notes: deliveryNotes
      },
      createdAt: new Date().toISOString()
    };

    onSubmit(newOrder);
  };

  const selectedDelivery = deliveryOptions.find(opt => opt.id === deliveryMethod);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Create New Order</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  placeholder="Enter customer email"
                />
              </div>
            </div>

            {/* Delivery Method Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Delivery Method</label>
              <div className="grid grid-cols-2 gap-3">
                {deliveryOptions.map(option => (
                  <div
                    key={option.id}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      deliveryMethod === option.id
                        ? 'border-[#b8860b] bg-amber-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setDeliveryMethod(option.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{option.name}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      <span className="text-[#b8860b] font-semibold">
                        {option.cost === 0 ? 'Free' : `KSh ${option.cost}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {deliveryMethod === 'pickup' ? 'Pickup Address *' : 'Shipping Address *'}
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows="2"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                placeholder={deliveryMethod === 'pickup' ? 'Store pickup address' : 'Enter shipping address'}
              />
            </div>

            {/* Delivery Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Notes (Optional)</label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                placeholder="e.g., Call before delivery, Gate code, etc."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Order Items</label>
                <button
                  type="button"
                  onClick={addOrderItem}
                  className="text-[#b8860b] hover:text-[#997500] text-sm"
                >
                  + Add Item
                </button>
              </div>
              
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <select
                    value={item.productId}
                    onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                    className="w-20 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                    placeholder="Qty"
                  />
                  
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary with Delivery Cost */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              {orderItems.map((item, index) => {
                const product = products.find(p => p.id === parseInt(item.productId));
                if (!product) return null;
                return (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span>{product.name} × {item.quantity}</span>
                    <span>${(product.price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${orderItems.reduce((sum, item) => {
                    const product = products.find(p => p.id === parseInt(item.productId));
                    return sum + (product ? product.price * item.quantity : 0);
                  }, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery ({selectedDelivery?.name}):</span>
                  <span>KSh {selectedDelivery?.cost || 0}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-[#b8860b]">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#b8860b] text-white px-6 py-2 rounded hover:bg-[#997500]"
            >
              Create Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderModal;