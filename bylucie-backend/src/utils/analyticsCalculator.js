import { readAnalytics } from '../middleware/analytics.js';

export const calculateAnalytics = async (period = '30d') => {
  const analytics = await readAnalytics();
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30d':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case '90d':
      startDate = new Date(now.setDate(now.getDate() - 90));
      break;
    default:
      startDate = new Date(0); // All time
  }

  // Filter data for the period
  const recentPageViews = analytics.pageViews.filter(pv => 
    new Date(pv.timestamp) >= startDate
  );
  const recentEvents = analytics.events.filter(ev => 
    new Date(ev.timestamp) >= startDate
  );
  const recentOrders = analytics.orders.filter(ord => 
    new Date(ord.timestamp) >= startDate
  );

  // Calculate metrics
  const totalPageViews = recentPageViews.length;
  const uniqueVisitors = new Set(recentPageViews.map(pv => pv.sessionId)).size;
  
  const productViews = recentEvents.filter(ev => ev.type === 'product_view').length;
  const ordersCount = recentOrders.length;
  
  const revenue = recentOrders.reduce((total, order) => 
    total + (order.data.totalAmount || 0), 0
  );

  // Calculate page views per day for charts
  const pageViewsByDay = recentPageViews.reduce((acc, pv) => {
    const date = pv.timestamp.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const monthlySales = Object.entries(pageViewsByDay).map(([date, views]) => ({
    date,
    views
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate popular products
  const productViewCounts = recentEvents
    .filter(ev => ev.type === 'product_view')
    .reduce((acc, ev) => {
      const productId = ev.data.productId;
      acc[productId] = {
        id: productId,
        name: ev.data.productName,
        views: (acc[productId]?.views || 0) + 1
      };
      return acc;
    }, {});

  const popularProducts = Object.values(productViewCounts)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    overview: {
      totalPageViews,
      uniqueVisitors,
      productViews,
      totalOrders: ordersCount,
      totalRevenue: revenue,
      averageOrderValue: ordersCount > 0 ? revenue / ordersCount : 0
    },
    charts: {
      monthlySales,
      orderStatus: [
        { status: 'Completed', count: ordersCount },
        { status: 'Pending', count: 0 } // You would track this from actual orders
      ]
    },
    popularProducts,
    dashboardStats: {
      today: {
        orders: recentOrders.filter(ord => 
          new Date(ord.timestamp).toDateString() === new Date().toDateString()
        ).length,
        revenue: recentOrders.filter(ord => 
          new Date(ord.timestamp).toDateString() === new Date().toDateString()
        ).reduce((sum, ord) => sum + (ord.data.totalAmount || 0), 0)
      },
      weekly: {
        orders: recentOrders.filter(ord => 
          new Date(ord.timestamp) >= new Date(now.setDate(now.getDate() - 7))
        ).length,
        revenue: recentOrders.filter(ord => 
          new Date(ord.timestamp) >= new Date(now.setDate(now.getDate() - 7))
        ).reduce((sum, ord) => sum + (ord.data.totalAmount || 0), 0)
      },
      alerts: {
        lowStock: 0, // You would calculate this from products
        pendingOrders: 0 // You would track this from orders
      }
    }
  };
};