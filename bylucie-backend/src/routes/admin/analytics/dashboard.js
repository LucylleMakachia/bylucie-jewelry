import express from 'express';
import { safeAggregate, safeCollectionCount } from '../../../utils/dbHelpers.js';

const router = express.Router();

// Main dashboard analytics endpoint - compatible with AnalyticsManager
router.get('/', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      todayStats,
      weeklyStats,
      monthlySales,
      orderStatus,
      popularProducts
    ] = await Promise.all([
      // Core counts
      safeCollectionCount('users'),
      safeCollectionCount('products', { isActive: true }),
      safeCollectionCount('orders'),
      
      // Pending orders (include multiple statuses)
      safeCollectionCount('orders', { 
        status: { $in: ['pending', 'processing', 'confirmed'] } 
      }),
      
      // Low stock products
      safeCollectionCount('products', { 
        stock: { $lt: 10 }, 
        isActive: true 
      }),

      // Today's stats
      safeAggregate('orders', [
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(new Date().setHours(0,0,0,0))
            },
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
      ]),

      // Weekly stats (last 7 days)
      safeAggregate('orders', [
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
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
      ]),

      // Monthly sales data (last 6 months)
      safeAggregate('orders', [
        {
          $match: {
            createdAt: { 
              $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: '%Y-%m', 
                date: '$createdAt', 
                timezone: 'Africa/Nairobi' 
              }
            },
            revenue: { $sum: '$total' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 6 },
        {
          $project: {
            month: '$_id',
            revenue: 1,
            sales: '$revenue',
            value: '$revenue',
            orders: '$orderCount'
          }
        }
      ]),

      // Order status distribution
      safeAggregate('orders', [
        {
          $match: {
            createdAt: { 
              $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            orders: '$count',
            value: '$count'
          }
        }
      ]),

      // Popular products (using cartItems)
      safeAggregate('orders', [
        { 
          $match: { 
            status: { $ne: 'cancelled' }
          } 
        },
        { $unwind: '$cartItems' },
        {
          $match: {
            'cartItems.productId': { $exists: true },
            'cartItems.quantity': { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$cartItems.productId',
            name: { $first: '$cartItems.name' },
            sales: { $sum: '$cartItems.quantity' },
            revenue: { 
              $sum: { 
                $multiply: ['$cartItems.quantity', '$cartItems.price'] 
              } 
            }
          }
        },
        { $sort: { sales: -1 } },
        { $limit: 5 },
        {
          $project: {
            name: 1,
            label: '$name',
            sales: 1,
            revenue: 1,
            value: '$sales',
            count: '$sales'
          }
        }
      ])
    ]);

    // Calculate total revenue from all non-cancelled orders
    const revenueResult = await safeAggregate('orders', [
      { 
        $match: { 
          status: { $ne: 'cancelled' } 
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const actualOrderCount = revenueResult[0]?.orderCount || 0;
    const averageOrderValue = actualOrderCount > 0 ? totalRevenue / actualOrderCount : 0;

    // Calculate unique customers
    const uniqueCustomers = await safeAggregate('orders', [
      {
        $group: {
          _id: '$userId'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    // Process today and weekly stats
    const todayData = todayStats[0] || { orders: 0, revenue: 0 };
    const weeklyData = weeklyStats[0] || { orders: 0, revenue: 0 };

    // Generate traffic sources (estimated)
    const uniqueVisitors = uniqueCustomers[0]?.count || totalUsers;
    const trafficSources = [
      { source: 'Direct', visitors: Math.floor(uniqueVisitors * 0.4), value: Math.floor(uniqueVisitors * 0.4) },
      { source: 'Organic Search', visitors: Math.floor(uniqueVisitors * 0.3), value: Math.floor(uniqueVisitors * 0.3) },
      { source: 'Social Media', visitors: Math.floor(uniqueVisitors * 0.15), value: Math.floor(uniqueVisitors * 0.15) },
      { source: 'Email', visitors: Math.floor(uniqueVisitors * 0.1), value: Math.floor(uniqueVisitors * 0.1) },
      { source: 'Referral', visitors: Math.floor(uniqueVisitors * 0.05), value: Math.floor(uniqueVisitors * 0.05) }
    ].filter(source => source.visitors > 0);

    // Return data in AnalyticsManager compatible format
    const response = {
      overview: {
        totalRevenue: totalRevenue,
        totalOrders: actualOrderCount,
        averageOrderValue: averageOrderValue,
        totalUsers: totalUsers,
        newUsers: totalUsers, // Simplified - you might want real new user calculation
        totalPageViews: Math.floor(totalUsers * 5), // Estimated
        uniqueVisitors: uniqueVisitors,
        productViews: Math.floor(totalUsers * 10) // Estimated
      },
      charts: {
        monthlySales: monthlySales || [],
        orderStatus: orderStatus || []
      },
      popularProducts: popularProducts || [],
      dashboardStats: {
        today: {
          orders: todayData.orders || 0,
          revenue: todayData.revenue || 0
        },
        weekly: {
          orders: weeklyData.orders || 0,
          revenue: weeklyData.revenue || 0
        },
        alerts: {
          lowStock: lowStockProducts || 0,
          pendingOrders: pendingOrders || 0
        }
      },
      trafficSources: trafficSources
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard analytics error:', error.stack || error);
    // Return empty structure in expected format
    res.status(500).json({
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
    });
  }
});

// Additional endpoint for quick dashboard stats only
router.get('/quick-stats', async (req, res) => {
  try {
    const [todayStats, pendingOrders, lowStockProducts] = await Promise.all([
      // Today's stats
      safeAggregate('orders', [
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(new Date().setHours(0,0,0,0))
            },
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
      ]),

      // Pending orders
      safeCollectionCount('orders', { 
        status: { $in: ['pending', 'processing', 'confirmed'] } 
      }),

      // Low stock products
      safeCollectionCount('products', { 
        stock: { $lt: 10 }, 
        isActive: true 
      })
    ]);

    const todayData = todayStats[0] || { orders: 0, revenue: 0 };

    res.json({
      today: {
        orders: todayData.orders || 0,
        revenue: todayData.revenue || 0
      },
      alerts: {
        pendingOrders: pendingOrders || 0,
        lowStock: lowStockProducts || 0
      }
    });
  } catch (error) {
    console.error('Quick stats error:', error);
    res.status(500).json({
      today: { orders: 0, revenue: 0 },
      alerts: { pendingOrders: 0, lowStock: 0 }
    });
  }
});

export default router;