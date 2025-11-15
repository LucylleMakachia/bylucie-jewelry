import express from 'express';
import { safeAggregate } from '../../../utils/dbHelpers.js';

const router = express.Router();

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Main sales analytics endpoint - compatible with AnalyticsManager
router.get('/', async (req, res) => {
  try {
    const { period = 'month', limit = 12 } = req.query;
    
    // Create cache key based on query parameters
    const cacheKey = `sales:${period}:${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    let dateFormat, monthsBack;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        monthsBack = 1;
        break;
      case 'week':
        dateFormat = '%Y-%U';
        monthsBack = 3;
        break;
      case 'year':
        dateFormat = '%Y';
        monthsBack = 5;
        break;
      default: // month
        dateFormat = '%Y-%m';
        monthsBack = 12;
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const matchStage = {
      // Include all orders except cancelled for analytics
      status: { $ne: 'cancelled' },
      createdAt: { $gte: startDate }
    };

    const pipeline = [
      { $match: matchStage },
      { 
        $group: {
          _id: { 
            $dateToString: { 
              format: dateFormat, 
              date: '$createdAt', 
              timezone: 'Africa/Nairobi' 
            } 
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          month: '$_id',
          revenue: 1,
          sales: '$revenue', // For compatibility
          value: '$revenue', // For compatibility
          orderCount: 1,
        },
      },
    ];

    const salesData = await safeAggregate('orders', pipeline);

    // Transform to AnalyticsManager expected format
    const formattedData = (salesData || []).map(item => ({
      month: item.month,
      revenue: item.revenue || 0,
      sales: item.sales || item.revenue || 0, // For compatibility
      value: item.value || item.revenue || 0, // For compatibility
      orders: item.orderCount || 0
    }));

    // Cache the response
    cache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    });

    res.json(formattedData);
  } catch (error) {
    console.error('Sales analytics error:', error.stack || error);
    // Return empty array in expected format
    res.status(500).json([]);
  }
});

// Additional endpoint for order status distribution (for AnalyticsManager)
router.get('/order-status', async (req, res) => {
  try {
    const cacheKey = 'order-status';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
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
          orders: '$count', // For compatibility
          value: '$count'   // For compatibility
        }
      }
    ];

    const statusData = await safeAggregate('orders', pipeline);

    // Transform status values for better display
    const formattedStatusData = (statusData || []).map(item => ({
      status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown',
      count: item.count || 0,
      orders: item.orders || item.count || 0,
      value: item.value || item.count || 0
    }));

    // Cache the response
    cache.set(cacheKey, {
      data: formattedStatusData,
      timestamp: Date.now()
    });

    res.json(formattedStatusData);
  } catch (error) {
    console.error('Order status analytics error:', error);
    res.status(500).json([]);
  }
});

// Dashboard overview stats endpoint
router.get('/overview', async (req, res) => {
  try {
    const cacheKey = 'sales-overview';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayStats = await safeAggregate('orders', [
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

    // Weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyStats = await safeAggregate('orders', [
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

    // Pending orders
    const pendingOrders = await safeAggregate('orders', [
      {
        $match: {
          status: { $in: ['pending', 'processing', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const overviewData = {
      today: {
        orders: todayStats[0]?.orders || 0,
        revenue: todayStats[0]?.revenue || 0
      },
      weekly: {
        orders: weeklyStats[0]?.orders || 0,
        revenue: weeklyStats[0]?.revenue || 0
      },
      alerts: {
        pendingOrders: pendingOrders[0]?.count || 0
      }
    };

    // Cache the response
    cache.set(cacheKey, {
      data: overviewData,
      timestamp: Date.now()
    });

    res.json(overviewData);
  } catch (error) {
    console.error('Sales overview error:', error);
    res.status(500).json({
      today: { orders: 0, revenue: 0 },
      weekly: { orders: 0, revenue: 0 },
      alerts: { pendingOrders: 0 }
    });
  }
});

// Clear cache endpoint for admin purposes
router.delete('/cache', (req, res) => {
  const deletedCount = cache.size;
  cache.clear();
  res.json({ 
    message: 'Cache cleared successfully', 
    deletedEntries: deletedCount 
  });
});

// Cache stats endpoint
router.get('/cache-stats', (req, res) => {
  res.json({
    size: cache.size,
    entries: Array.from(cache.keys()),
    ttl: CACHE_TTL / 1000 + ' seconds'
  });
});

export default router;