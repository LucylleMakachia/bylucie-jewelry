import express from 'express';
import dashboardRoutes from './dashboard.js';
import salesRoutes from './sales.js';
import productsRoutes from './products.js';
import customersRoutes from './customers.js';
import geographicRoutes from './geographic.js';

const router = express.Router();

// Add debugging middleware to see what routes are being called
router.use((req, res, next) => {
  console.log(`📊 Analytics route called: ${req.method} ${req.originalUrl}`);
  next();
});

// Order Status Endpoint - Real data only
router.get('/order-status', async (req, res) => {
  try {
    console.log('📊 Order status endpoint called');
    
    const Order = (await import('../../../models/Order.js')).default;
    
    const orderStatusData = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format for frontend compatibility - return object with status counts
    const formattedData = orderStatusData.reduce((acc, item) => {
      const status = item._id || 'unknown';
      acc[status] = item.count;
      return acc;
    }, {});

    console.log('✅ Order status data:', formattedData);
    res.json(formattedData);

  } catch (error) {
    console.error('❌ Order status analytics error:', error);
    
    // Return error only - no mock data
    res.status(500).json({ 
      error: 'Failed to fetch order status data',
      message: error.message
    });
  }
});

// Overview Endpoint - Real data only
router.get('/overview', async (req, res) => {
  try {
    console.log('📊 Overview endpoint called');
    
    const Order = (await import('../../../models/Order.js')).default;
    const Product = (await import('../../../models/Product.js')).default;
    const User = (await import('../../../models/User.js')).default;

    // Get basic counts
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments()
    ]);

    console.log(`📈 Basic counts - Orders: ${totalOrders}, Products: ${totalProducts}, Users: ${totalUsers}`);

    // Calculate revenue from non-cancelled orders
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Get new users (last 30 days)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top selling product
    const topProductData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$cartItems' },
      {
        $group: {
          _id: '$cartItems.productId',
          name: { $first: '$cartItems.name' },
          totalSold: { $sum: '$cartItems.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 1 }
    ]);

    const topSellingProduct = topProductData[0]?.name || 'No sales data';

    const overviewData = {
      totalRevenue,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalUsers,
      newUsers,
      totalProducts,
      topSellingProduct
    };

    console.log('✅ Overview data prepared:', overviewData);
    res.json(overviewData);

  } catch (error) {
    console.error('❌ Overview analytics error:', error);
    
    // Return error only - no mock data
    res.status(500).json({
      error: 'Failed to fetch overview data',
      message: error.message
    });
  }
});

// Main analytics endpoint - Real data only
router.get('/', async (req, res) => {
  try {
    console.log('📊 Main analytics endpoint called - loading models...');
    
    // Import models
    const Order = (await import('../../../models/Order.js')).default;
    const Product = (await import('../../../models/Product.js')).default;
    const User = (await import('../../../models/User.js')).default;

    console.log('✅ Models loaded successfully');

    // Get basic counts
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments()
    ]);

    console.log(`📈 Counts - Orders: ${totalOrders}, Products: ${totalProducts}, Users: ${totalUsers}`);

    // Calculate revenue from non-cancelled orders
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get weekly date range
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get today's and weekly orders count (non-cancelled)
    const [todayOrders, weeklyOrders] = await Promise.all([
      Order.countDocuments({ 
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
      }),
      Order.countDocuments({ 
        createdAt: { $gte: oneWeekAgo },
        status: { $ne: 'cancelled' }
      })
    ]);

    // Get today's and weekly revenue (non-cancelled)
    const [todayRevenueData, weeklyRevenueData] = await Promise.all([
      Order.aggregate([
        { 
          $match: { 
            status: { $ne: 'cancelled' },
            createdAt: { $gte: today, $lt: tomorrow } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            status: { $ne: 'cancelled' },
            createdAt: { $gte: oneWeekAgo } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const todayRevenue = todayRevenueData[0]?.total || 0;
    const weeklyRevenue = weeklyRevenueData[0]?.total || 0;

    // Get alerts data
    const [lowStockProducts, pendingOrders] = await Promise.all([
      Product.countDocuments({
        $or: [
          { stock: { $lte: 5 } },
          { stock: { $exists: false } }
        ]
      }),
      Order.countDocuments({
        status: { $in: ['pending', 'processing', 'confirmed'] }
      })
    ]);

    // Get order status distribution
    const orderStatusData = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get popular products (last 30 days, non-cancelled orders)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const popularProducts = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: oneMonthAgo },
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
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: 1,
          label: '$name',
          sales: 1,
          revenue: 1,
          value: '$sales',
          count: '$sales'
        }
      }
    ]);

    // Get monthly sales data (last 6 months, non-cancelled orders)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly sales
    const monthlySalesFormatted = monthlySales.map(item => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
      revenue: item.revenue,
      sales: item.revenue,
      value: item.revenue,
      orders: item.orderCount
    }));

    // Format order status
    const orderStatusFormatted = orderStatusData.map(item => ({
      status: item._id || 'unknown',
      count: item.count,
      orders: item.count,
      value: item.count
    }));

    // Calculate new users (last 30 days)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });

    // Calculate unique customers from orders
    const uniqueCustomers = await Order.aggregate([
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

    const uniqueVisitors = uniqueCustomers[0]?.count || 0;

    // Calculate actual traffic data if available, otherwise empty
    const trafficSources = []; // Remove estimated data

    // Prepare response with only real data
    const analyticsData = {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalUsers,
        newUsers,
        totalPageViews: 0, // Remove estimated data
        uniqueVisitors,
        productViews: 0, // Remove estimated data
      },
      charts: {
        monthlySales: monthlySalesFormatted,
        orderStatus: orderStatusFormatted,
      },
      popularProducts: popularProducts || [],
      dashboardStats: {
        today: { 
          orders: todayOrders, 
          revenue: todayRevenue 
        },
        weekly: { 
          orders: weeklyOrders, 
          revenue: weeklyRevenue 
        },
        alerts: { 
          lowStock: lowStockProducts, 
          pendingOrders: pendingOrders 
        },
      },
      trafficSources: trafficSources // Empty array instead of estimated data
    };

    console.log('✅ Main analytics data prepared successfully');
    res.json(analyticsData);

  } catch (error) {
    console.error('❌ Main analytics API Error:', error);
    
    // Return error only - no fallback data
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
});

// Keep the existing endpoints information available
router.get('/endpoints', (req, res) => {
  res.json({
    analytics: {
      availableEndpoints: [
        {
          path: '/order-status',
          description: 'Order status distribution analytics',
          methods: ['GET']
        },
        {
          path: '/overview',
          description: 'Business overview and key metrics',
          methods: ['GET']
        },
        {
          path: '/',
          description: 'Comprehensive dashboard statistics and overview',
          methods: ['GET']
        },
        {
          path: '/dashboard',
          description: 'Dashboard statistics and charts',
          methods: ['GET']
        },
        {
          path: '/sales',
          description: 'Sales analytics with time series data',
          methods: ['GET'],
          queryParams: ['period', 'country', 'category', 'paymentMethod']
        },
        {
          path: '/products',
          description: 'Product performance and inventory analytics',
          methods: ['GET']
        },
        {
          path: '/customers',
          description: 'Customer behavior and segmentation analytics',
          methods: ['GET']
        },
        {
          path: '/geographic',
          description: 'Geographic distribution and regional analytics',
          methods: ['GET']
        }
      ],
      metadata: {
        version: '1.0.0',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        cacheEnabled: true,
        cacheTTL: '2 minutes'
      }
    }
  });
});

// Mount analytics sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/sales', salesRoutes);
router.use('/products', productsRoutes);
router.use('/customers', customersRoutes);
router.use('/geographic', geographicRoutes);

export default router;