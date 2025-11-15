import React, { useState } from 'react';

function DeliveryManagementModal({ order, visible, onClose, onUpdate }) {
  const [trackingNumber, setTrackingNumber] = useState(order?.delivery?.trackingNumber || '');
  const [deliveryStatus, setDeliveryStatus] = useState(order?.delivery?.status || 'pending');
  const [driverInfo, setDriverInfo] = useState(order?.delivery?.driverInfo || { name: '', phone: '', vehicle: '' });

  const deliveryStatuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'assigned', label: 'Driver Assigned', color: 'bg-blue-100 text-blue-800' },
    { value: 'picked_up', label: 'Picked Up', color: 'bg-purple-100 text-purple-800' },
    { value: 'in_transit', label: 'In Transit', color: 'bg-orange-100 text-orange-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' }
  ];

  const handleSubmit = () => {
    const updatedOrder = {
      ...order,
      delivery: {
        ...order.delivery,
        trackingNumber,
        status: deliveryStatus,
        driverInfo,
        updatedAt: new Date().toISOString()
      }
    };

    onUpdate(updatedOrder);
    onClose();
  };

  const generateTrackingNumber = (service) => {
    const prefixes = { pickupmtaani: 'PM', bolt: 'BOLT', uber: 'UBER', pickup: 'PICKUP' };
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    setTrackingNumber(`${prefixes[service]}-${random}`);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Manage Delivery</h3>
          
          <div className="space-y-4">
            {/* Order Info */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-semibold">Order #{order.id}</h4>
              <p className="text-sm">{order.customerName} • {order.customerEmail}</p>
              <p className="text-sm text-gray-600">{order.delivery?.address}</p>
            </div>

            {/* Delivery Service */}
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Service</label>
              <div className="p-2 bg-gray-100 rounded text-sm capitalize">
                {order.delivery?.method === 'pickupmtaani' && '📦 PickupMtaani'}
                {order.delivery?.method === 'bolt' && '🚗 Bolt Delivery'}
                {order.delivery?.method === 'uber' && '🚙 Uber Delivery'}
                {order.delivery?.method === 'pickup' && '🏪 Store Pickup'}
              </div>
            </div>

            {/* Tracking Number */}
            <div>
              <label className="block text-sm font-medium mb-1">Tracking Number</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  placeholder="Enter tracking number"
                />
                <button
                  onClick={() => generateTrackingNumber(order.delivery?.method)}
                  className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Delivery Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Status</label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
              >
                {deliveryStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Information (for delivery services) */}
            {order.delivery?.method !== 'pickup' && (
              <div>
                <label className="block text-sm font-medium mb-1">Driver Information</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Driver Name"
                    value={driverInfo.name}
                    onChange={(e) => setDriverInfo({...driverInfo, name: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  />
                  <input
                    type="tel"
                    placeholder="Driver Phone"
                    value={driverInfo.phone}
                    onChange={(e) => setDriverInfo({...driverInfo, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  />
                  <input
                    type="text"
                    placeholder="Vehicle Details"
                    value={driverInfo.vehicle}
                    onChange={(e) => setDriverInfo({...driverInfo, vehicle: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
                  />
                </div>
              </div>
            )}
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
              Update Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryManagementModal;