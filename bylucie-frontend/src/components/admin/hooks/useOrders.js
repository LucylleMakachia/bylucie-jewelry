import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const useOrders = (getToken, showToast) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // FIXED: Use admin endpoint to get all orders including guest orders
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
      
      // Handle different response formats
      let ordersArray = [];
      if (Array.isArray(data)) {
        ordersArray = data;
      } else if (data.orders && Array.isArray(data.orders)) {
        ordersArray = data.orders;
      } else if (data.data && Array.isArray(data.data)) {
        ordersArray = data.data;
      }
      
      setOrders(ordersArray);
      
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setOrders([]);
      showToast('❌ Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast]);

  const handleUpdateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error(`Failed to update order status: ${res.status}`);
      
      const result = await res.json();
      setOrders(prev => prev.map(order => 
        order._id === orderId || order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      showToast(`📦 Order status updated to ${newStatus}`, 'success');
      return result;
    } catch (err) {
      showToast('❌ Failed to update order status', 'error');
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