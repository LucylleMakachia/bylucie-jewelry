import express from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { authenticateClerk, requireAdmin } from '../../middleware/clerkAuth.js';

import authRoutes from '../auth.js';
import ordersRoutes from './orders.js';
import paymentRoutes from '../payment.js';
import pickupRoutes from '../pickup.js';
import productsRoutes from './products.js';
import pagesRoutes from '../pages.js';

const router = express.Router();

router.use(authenticateClerk);
router.use(requireAdmin);

// Helper to read JSON data files
async function readJSON(filename) {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Config endpoint
router.get('/config', async (req, res, next) => {
  try {
    const cacheKey = 'admin:config';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const config = {
      version: '1.0.0',
      siteName: 'Your Store',
      features: {
        payments: true,
        orders: true,
        products: true,
        inventory: true,
        analytics: true,
        multiCurrency: false
      },
      settings: {
        currency: 'KES',
        taxEnabled: true,
        shippingEnabled: true,
        timezone: 'Africa/Nairobi',
        baseCountry: 'Kenya'
      },
      permissions: {
        canManageProducts: true,
        canManageOrders: true,
        canManageUsers: true,
        canViewAnalytics: true
      }
    };

    cache.set(cacheKey, {
      data: config,
      timestamp: Date.now()
    });

    res.json(config);
  } catch (err) {
    next(err);
  }
});

// Enhanced dashboard stats route
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'admin:dashboard';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const [products, orders, pages] = await Promise.all([
      readJSON('products.json'),
      readJSON('orders.json'),
      readJSON('pagesContent.json'),
    ]);

    // Calculate comprehensive statistics
    const totalRevenue = orders
      .filter(order => order.status === 'delivered' || order.status === 'completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const paymentMethodCounts = orders.reduce((acc, order) => {
      const method = order.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const lowStockProducts = products.filter(p => (p.stock || 0) < 10).length;

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentOrders = orders
      .filter(order => new Date(order.createdAt || order.updatedAt) > oneWeekAgo)
      .slice(-10)
      .reverse();

    const recentProducts = products
      .filter(product => new Date(product.createdAt || product.updatedAt) > oneWeekAgo)
      .slice(-5)
      .reverse();

    const stats = {
      // Core metrics
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === 'active' || p.isActive).length,
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      completedOrders: orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
      totalPages: Object.keys(pages).length,
      
      // Enhanced metrics
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      lowStockProducts,
      statusCounts,
      paymentMethodCounts,
      
      // Recent activity
      recentOrders: recentOrders.map(order => ({
        id: order.id || order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        customerName: order.customerInfo?.fullName,
        createdAt: order.createdAt
      })),
      recentProducts: recentProducts.map(product => ({
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt
      }))
    };

    const response = {
      stats,
      metadata: {
        generatedAt: new Date().toISOString(),
        timezone: 'Africa/Nairobi',
        currency: 'KES'
      }
    };

    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Analytics summary endpoint
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const cacheKey = 'admin:analytics:summary';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const [products, orders] = await Promise.all([
      readJSON('products.json'),
      readJSON('orders.json'),
    ]);

    // Calculate monthly growth
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear;
    });

    const currentMonthRevenue = currentMonthOrders
      .filter(order => order.status === 'delivered' || order.status === 'completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const previousMonthRevenue = previousMonthOrders
      .filter(order => order.status === 'delivered' || order.status === 'completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    const orderGrowth = previousMonthOrders.length > 0
      ? ((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100
      : currentMonthOrders.length > 0 ? 100 : 0;

    const response = {
      revenue: {
        current: Math.round(currentMonthRevenue * 100) / 100,
        previous: Math.round(previousMonthRevenue * 100) / 100,
        growth: Math.round(revenueGrowth * 100) / 100
      },
      orders: {
        current: currentMonthOrders.length,
        previous: previousMonthOrders.length,
        growth: Math.round(orderGrowth * 100) / 100
      },
      products: {
        total: products.length,
        active: products.filter(p => p.status === 'active' || p.isActive).length,
        lowStock: products.filter(p => (p.stock || 0) < 10).length
      },
      metadata: {
        period: 'monthly',
        currentMonth: currentMonth + 1,
        currentYear,
        generatedAt: new Date().toISOString()
      }
    };

    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Overview endpoint (what the frontend is looking for)
router.get('/analytics/overview', async (req, res, next) => {
  try {
    const cacheKey = 'admin:analytics:overview';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const [products, orders] = await Promise.all([
      readJSON('products.json'),
      readJSON('orders.json'),
    ]);

    // Calculate overview statistics
    const totalRevenue = orders
      .filter(order => order.status === 'delivered' || order.status === 'completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const totalOrders = orders.length;
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active' || p.isActive).length;

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders
      .filter(order => new Date(order.createdAt || order.updatedAt) > thirtyDaysAgo)
      .length;

    const recentRevenue = orders
      .filter(order => (order.status === 'delivered' || order.status === 'completed') && 
                      new Date(order.createdAt || order.updatedAt) > thirtyDaysAgo)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const response = {
      overview: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalProducts,
        activeProducts,
        recentOrders,
        recentRevenue: Math.round(recentRevenue * 100) / 100,
        averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        period: 'all_time',
        currency: 'KES'
      }
    };

    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Order status distribution endpoint
router.get('/analytics/order-status', async (req, res, next) => {
  try {
    const cacheKey = 'admin:analytics:order-status';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const orders = await readJSON('orders.json');

    // Calculate order status distribution
    const statusDistribution = orders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format for charts
    const statusArray = Object.entries(statusDistribution).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / orders.length) * 10000) / 100 // Rounded to 2 decimal places
    }));

    const response = {
      distribution: statusArray,
      totalOrders: orders.length,
      metadata: {
        generatedAt: new Date().toISOString()
      }
    };

    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Cache management endpoint
router.delete('/cache/clear', (req, res) => {
  const deletedCount = cache.size;
  cache.clear();
  res.json({ 
    message: 'Admin cache cleared successfully', 
    deletedEntries: deletedCount,
    timestamp: new Date().toISOString()
  });
});

// Cache stats endpoint
router.get('/cache/stats', (req, res) => {
  res.json({
    size: cache.size,
    entries: Array.from(cache.keys()),
    ttl: CACHE_TTL / 1000 + ' seconds',
    timestamp: new Date().toISOString()
  });
});

// Mount admin sub-routes
router.use('/auth', authRoutes);
router.use('/orders', ordersRoutes);
router.use('/payment', paymentRoutes);
router.use('/pickup', pickupRoutes);
router.use('/products', productsRoutes);
router.use('/pages', pagesRoutes);

export default router;