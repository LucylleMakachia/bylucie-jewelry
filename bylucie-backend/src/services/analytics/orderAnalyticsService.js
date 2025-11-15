import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

export async function getOrderStatusBreakdown(startDate, endDate) {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    return result.map(item => ({
      status: item._id,
      count: item.count,
      orders: item.count,
      value: item.count
    }));
  } catch (error) {
    console.error('Error in getOrderStatusBreakdown:', error);
    return [];
  }
}

export async function getAverageOrderValue(startDate, endDate) {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          avgOrderValue: { $avg: '$total' },
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        },
      },
    ]);
    
    return {
      averageOrderValue: result[0]?.avgOrderValue || 0,
      totalRevenue: result[0]?.totalRevenue || 0,
      totalOrders: result[0]?.orderCount || 0
    };
  } catch (error) {
    console.error('Error in getAverageOrderValue:', error);
    return { averageOrderValue: 0, totalRevenue: 0, totalOrders: 0 };
  }
}

export async function getOrdersOverTime(interval = 'month', startDate, endDate) {
  try {
    const dateFormatMap = {
      day: '%Y-%m-%d',
      month: '%Y-%m',
      year: '%Y',
    };
    const format = dateFormatMap[interval] || dateFormatMap.month;

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format, date: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { '_id': 1 } },
    ]);
    
    return result.map(item => ({
      month: item._id,
      revenue: item.revenue,
      sales: item.revenue,
      value: item.revenue
    }));
  } catch (error) {
    console.error('Error in getOrdersOverTime:', error);
    return [];
  }
}

export async function getPopularProducts(startDate, endDate, limit = 5) {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$cartItems' },
      {
        $group: {
          _id: '$cartItems.productId',
          name: { $first: '$cartItems.name' },
          sales: { $sum: '$cartItems.quantity' },
          revenue: { 
            $sum: { 
              $multiply: ['$cartItems.price', '$cartItems.quantity'] 
            } 
          }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: limit }
    ]);

    return result.map(item => ({
      name: item.name,
      label: item.name,
      sales: item.sales,
      revenue: item.revenue,
      value: item.sales,
      count: item.sales
    }));
  } catch (error) {
    console.error('Error in getPopularProducts:', error);
    return [];
  }
}

export async function getDashboardStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo, $lte: new Date() },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'processing', 'confirmed'] }
    });

    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    return {
      today: {
        orders: todayStats[0]?.orders || 0,
        revenue: todayStats[0]?.revenue || 0
      },
      weekly: {
        orders: weeklyStats[0]?.orders || 0,
        revenue: weeklyStats[0]?.revenue || 0
      },
      alerts: {
        pendingOrders,
        lowStock: lowStockProducts
      }
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return {
      today: { orders: 0, revenue: 0 },
      weekly: { orders: 0, revenue: 0 },
      alerts: { pendingOrders: 0, lowStock: 0 }
    };
  }
}

export async function getUserMetrics(startDate, endDate) {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          newUsers: { $sum: 1 }
        }
      }
    ]);

    return {
      totalUsers: result[0]?.totalUsers || 0,
      newUsers: result[0]?.newUsers || 0,
      totalPageViews: 0,
      uniqueVisitors: result[0]?.totalUsers || 0,
      productViews: 0
    };
  } catch (error) {
    console.error('Error in getUserMetrics:', error);
    return {
      totalUsers: 0,
      newUsers: 0,
      totalPageViews: 0,
      uniqueVisitors: 0,
      productViews: 0
    };
  }
}

export async function getCompleteAnalytics() {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const [
      orderStatus,
      averageData,
      monthlySales,
      popularProducts,
      dashboardStats,
      userMetrics
    ] = await Promise.all([
      getOrderStatusBreakdown(startDate, endDate),
      getAverageOrderValue(startDate, endDate),
      getOrdersOverTime('month', startDate, endDate),
      getPopularProducts(startDate, endDate),
      getDashboardStats(),
      getUserMetrics(startDate, endDate)
    ]);

    const trafficSources = [
      { source: 'Direct', visitors: Math.floor(userMetrics.uniqueVisitors * 0.4), value: Math.floor(userMetrics.uniqueVisitors * 0.4) },
      { source: 'Organic Search', visitors: Math.floor(userMetrics.uniqueVisitors * 0.3), value: Math.floor(userMetrics.uniqueVisitors * 0.3) },
      { source: 'Social Media', visitors: Math.floor(userMetrics.uniqueVisitors * 0.2), value: Math.floor(userMetrics.uniqueVisitors * 0.2) },
      { source: 'Email', visitors: Math.floor(userMetrics.uniqueVisitors * 0.1), value: Math.floor(userMetrics.uniqueVisitors * 0.1) }
    ].filter(source => source.visitors > 0);

    return {
      overview: {
        totalRevenue: averageData.totalRevenue,
        totalOrders: averageData.totalOrders,
        averageOrderValue: averageData.averageOrderValue,
        totalUsers: userMetrics.totalUsers,
        newUsers: userMetrics.newUsers,
        totalPageViews: userMetrics.totalPageViews,
        uniqueVisitors: userMetrics.uniqueVisitors,
        productViews: userMetrics.productViews
      },
      charts: {
        monthlySales,
        orderStatus
      },
      popularProducts,
      dashboardStats,
      trafficSources
    };
  } catch (error) {
    console.error('Error in getCompleteAnalytics:', error);
    return {
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
      charts: {
        monthlySales: [],
        orderStatus: []
      },
      popularProducts: [],
      dashboardStats: {
        today: { orders: 0, revenue: 0 },
        weekly: { orders: 0, revenue: 0 },
        alerts: { lowStock: 0, pendingOrders: 0 }
      },
      trafficSources: []
    };
  }
}