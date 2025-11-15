import express from 'express';
import { safeAggregate, safeCollectionCount } from '../../../utils/dbHelpers.js';

const router = express.Router();

// Main customer analytics endpoint - compatible with AnalyticsManager
router.get('/', async (req, res) => {
  try {
    const [totalUsers, userGrowth, customerMetrics] = await Promise.all([
      // Total users count
      safeCollectionCount('users'),
      
      // User growth over time (for charts)
      safeAggregate('users', [
        {
          $group: {
            _id: { 
              $dateToString: { 
                format: '%Y-%m', 
                date: '$createdAt', 
                timezone: 'Africa/Nairobi' 
              } 
            },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 6 },
        {
          $project: {
            month: '$_id',
            newUsers: 1,
            value: '$newUsers' // For compatibility
          }
        }
      ]),
      
      // Customer metrics from orders
      safeAggregate('orders', [
        {
          $match: {
            createdAt: { 
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        },
        {
          $group: {
            _id: '$userId',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            firstOrder: { $min: '$createdAt' },
            lastOrder: { $max: '$createdAt' }
          }
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            newCustomers: {
              $sum: {
                $cond: [
                  { 
                    $gte: [
                      '$firstOrder', 
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                    ] 
                  },
                  1,
                  0
                ]
              }
            },
            activeCustomers: {
              $sum: {
                $cond: [
                  { 
                    $gte: [
                      '$lastOrder', 
                      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    ] 
                  },
                  1,
                  0
                ]
              }
            },
            totalRevenue: { $sum: '$totalSpent' }
          }
        }
      ])
    ]);

    // Extract customer metrics
    const metrics = customerMetrics && customerMetrics[0] ? customerMetrics[0] : {
      totalCustomers: 0,
      newCustomers: 0,
      activeCustomers: 0,
      totalRevenue: 0
    };

    // Calculate additional metrics
    const averageOrderValue = metrics.totalCustomers > 0 ? 
      metrics.totalRevenue / metrics.totalCustomers : 0;

    // Generate traffic sources (you'll need real tracking for this)
    const trafficSources = [
      { source: 'Direct', visitors: Math.floor(totalUsers * 0.4), value: Math.floor(totalUsers * 0.4) },
      { source: 'Organic Search', visitors: Math.floor(totalUsers * 0.3), value: Math.floor(totalUsers * 0.3) },
      { source: 'Social Media', visitors: Math.floor(totalUsers * 0.15), value: Math.floor(totalUsers * 0.15) },
      { source: 'Email', visitors: Math.floor(totalUsers * 0.1), value: Math.floor(totalUsers * 0.1) },
      { source: 'Referral', visitors: Math.floor(totalUsers * 0.05), value: Math.floor(totalUsers * 0.05) }
    ].filter(source => source.visitors > 0);

    // Return data in AnalyticsManager compatible format
    const response = {
      overview: {
        totalUsers: totalUsers || 0,
        newUsers: metrics.newCustomers || 0,
        totalRevenue: metrics.totalRevenue || 0,
        totalOrders: metrics.totalCustomers || 0, // Using customer count as proxy
        averageOrderValue: averageOrderValue || 0,
        uniqueVisitors: metrics.activeCustomers || 0,
        totalPageViews: Math.floor(totalUsers * 5) || 0, // Estimated
        productViews: Math.floor(totalUsers * 10) || 0   // Estimated
      },
      charts: {
        monthlySales: userGrowth || [], // Reusing user growth for monthly sales
        orderStatus: [] // This would come from orders analytics
      },
      popularProducts: [], // This would come from products analytics
      dashboardStats: {
        today: { orders: 0, revenue: 0 }, // This would come from sales analytics
        weekly: { orders: 0, revenue: 0 }, // This would come from sales analytics
        alerts: { lowStock: 0, pendingOrders: 0 } // This would come from orders analytics
      },
      trafficSources: trafficSources
    };

    res.json(response);
  } catch (error) {
    console.error('Customer analytics error:', error.stack || error);
    // Return empty structure in expected format
    res.status(500).json({
      overview: {
        totalUsers: 0,
        newUsers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        uniqueVisitors: 0,
        totalPageViews: 0,
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

// Additional endpoint for user growth chart data
router.get('/growth', async (req, res) => {
  try {
    const userGrowth = await safeAggregate('users', [
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m', 
              date: '$createdAt', 
              timezone: 'Africa/Nairobi' 
            } 
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
      {
        $project: {
          month: '$_id',
          revenue: '$newUsers', // Using newUsers as revenue for compatibility
          sales: '$newUsers',   // For compatibility
          value: '$newUsers',   // For compatibility
          newUsers: 1
        }
      }
    ]);

    res.json(userGrowth || []);
  } catch (error) {
    console.error('User growth analytics error:', error);
    res.status(500).json([]);
  }
});

// Customer countries analytics (for geographic insights)
router.get('/countries', async (req, res) => {
  try {
    const customerCountries = await safeAggregate('orders', [
      { 
        $match: { 
          $or: [
            { 'shippingAddress.country': { $exists: true, $ne: null } },
            { 'customer.country': { $exists: true, $ne: null } },
            { 'user.country': { $exists: true, $ne: null } }
          ]
        } 
      },
      {
        $group: {
          _id: {
            $ifNull: [
              '$shippingAddress.country',
              '$customer.country', 
              '$user.country',
              'Unknown'
            ]
          },
          customerCount: { $addToSet: '$userId' },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
        },
      },
      {
        $project: {
          country: '$_id',
          customerCount: { $size: '$customerCount' },
          orderCount: 1,
          totalRevenue: 1,
          averageOrderValue: {
            $cond: [
              { $gt: ['$orderCount', 0] }, 
              { $divide: ['$totalRevenue', '$orderCount'] }, 
              0
            ],
          },
        },
      },
      { $sort: { orderCount: -1 } },
    ]);

    res.json(customerCountries || []);
  } catch (error) {
    console.error('Customer countries analytics error:', error);
    res.status(500).json([]);
  }
});

export default router;