import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const useAnalytics = (getToken, orders, products, showToast) => {
  const [analytics, setAnalytics] = useState({
    overview: { 
      totalRevenue: 0, 
      totalOrders: 0, 
      averageOrderValue: 0, 
      totalUsers: 0, 
      newUsers: 0,
      totalPageViews: 0,
      uniqueVisitors: 0,
      productViews: 0
    },
    charts: { monthlySales: [], orderStatus: [] },
    popularProducts: [],
    dashboardStats: { 
      today: { orders: 0, revenue: 0 }, 
      weekly: { orders: 0, revenue: 0 },
      alerts: { lowStock: 0, pendingOrders: 0 } 
    },
    trafficSources: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const calculateAnalyticsFromLocalData = useCallback(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const lowStock = products.filter(p => (p.stock || 0) < 10).length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.includes(today));
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    setAnalytics({
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalUsers: new Set(orders.map(o => o.userId)).size,
        newUsers: 0,
        totalPageViews: 0,
        uniqueVisitors: 0,
        productViews: 0
      },
      charts: {
        monthlySales: [],
        orderStatus: Object.entries(orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {}))
      },
      popularProducts: products.slice(0, 5).map(p => ({
        name: p.name,
        views: p.views || 0,
        sales: orders.filter(o => o.items?.some(item => item.productId === p._id)).length
      })),
      dashboardStats: {
        today: { orders: todayOrders.length, revenue: todayRevenue },
        weekly: { orders: totalOrders, revenue: totalRevenue },
        alerts: { lowStock, pendingOrders }
      },
      trafficSources: []
    });
  }, [orders, products]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const token = await getToken();
      
      const [salesResponse, statusResponse, overviewResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/analytics/sales`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${API_BASE_URL}/api/admin/analytics/order-status`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${API_BASE_URL}/api/admin/analytics/overview`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);

      if (salesResponse.ok && statusResponse.ok && overviewResponse.ok) {
        const [salesData, statusData, overviewData] = await Promise.all([
          salesResponse.json(),
          statusResponse.json(),
          overviewResponse.json()
        ]);

        setAnalytics(prev => ({
          ...prev,
          charts: {
            monthlySales: salesData.monthlySales || [],
            orderStatus: statusData.orderStatus || []
          },
          overview: {
            ...prev.overview,
            ...overviewData
          }
        }));
      } else {
        calculateAnalyticsFromLocalData();
      }
    } catch (error) {
      calculateAnalyticsFromLocalData();
    } finally {
      setAnalyticsLoading(false);
    }
  }, [getToken, calculateAnalyticsFromLocalData]);

  useEffect(() => {
    if (orders.length > 0 || products.length > 0) {
      calculateAnalyticsFromLocalData();
    }
  }, [orders, products, calculateAnalyticsFromLocalData]);

  return {
    analytics,
    analyticsLoading,
    fetchAnalytics
  };
};