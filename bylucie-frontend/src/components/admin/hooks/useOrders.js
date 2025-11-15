import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const useOrders = (getToken, showToast) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      console.log('🔄 Fetching orders from admin endpoint...');
      
      const res = await fetch(`${API_BASE_URL}/api/admin/orders`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('📦 Orders API response:', data);
      
      // Handle the new response format from updated admin controller
      let ordersArray = [];
      if (data.success && Array.isArray(data.orders)) {
        ordersArray = data.orders;
        console.log(`📦 Successfully loaded ${ordersArray.length} orders (${data.summary?.guestOrders || 0} guest, ${data.summary?.userOrders || 0} user)`);
      } else if (Array.isArray(data)) {
        ordersArray = data;
      } else if (data.orders && Array.isArray(data.orders)) {
        ordersArray = data.orders;
      } else if (data.data && Array.isArray(data.data)) {
        ordersArray = data.data;
      }
      
      // Log guest orders for debugging
      const guestOrders = ordersArray.filter(order => order.guestCustomer);
      console.log(`👤 Found ${guestOrders.length} guest orders:`, guestOrders.map(o => ({
        id: o._id,
        customer: o.guestCustomer?.fullName,
        email: o.guestCustomer?.email,
        items: o.products?.length
      })));
      
      setOrders(ordersArray);
      
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setOrders([]);
      showToast('❌ Failed to fetch orders: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast]);

  const handleUpdateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const token = await getToken();
      console.log(`🔄 Updating order ${orderId} status to ${newStatus}`);
      
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        throw new Error(`Failed to update order status: ${res.status}`);
      }
      
      const result = await res.json();
      
      if (result.success) {
        // Update local state with the returned order data
        setOrders(prev => prev.map(order => 
          order._id === orderId || order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
        showToast(`📦 Order status updated to ${newStatus}`, 'success');
      } else {
        throw new Error(result.error || 'Failed to update order status');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Error updating order status:', err);
      showToast('❌ Failed to update order status: ' + err.message, 'error');
      throw err;
    }
  }, [getToken, showToast]);

  return {
    orders,
    loading,
    fetchOrders,
    handleUpdateOrderStatus
  };
};