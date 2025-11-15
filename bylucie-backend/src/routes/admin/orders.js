import express from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { authenticateClerk, requireAdmin } from '../../middleware/clerkAuth.js';

const router = express.Router();
const dataFilePath = path.join(process.cwd(), 'data', 'orders.json');

function ensureDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fsSync.existsSync(dataDir)) {
    fsSync.mkdirSync(dataDir, { recursive: true });
  }
  if (!fsSync.existsSync(dataFilePath)) {
    fsSync.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
  }
}

async function readOrders() {
  try {
    ensureDataFile();
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading orders:', err);
    return [];
  }
}

async function writeOrders(orders) {
  try {
    ensureDataFile();
    await fs.writeFile(dataFilePath, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Error writing orders:', err);
    throw new Error('Failed to save orders');
  }
}

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Apply Clerk authentication and admin authorization for all routes
router.use(authenticateClerk, requireAdmin);

// GET all orders with filtering, pagination, and sorting
router.get('/', async (req, res, next) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search,
      customerEmail,
      paymentMethod 
    } = req.query;

    // Create cache key based on query parameters
    const cacheKey = `orders:${status}:${page}:${limit}:${sortBy}:${sortOrder}:${search}:${customerEmail}:${paymentMethod}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    let orders = await readOrders();

    // Apply filters
    if (status && status !== 'all') {
      orders = orders.filter(order => order.status === status);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      orders = orders.filter(order => order.paymentMethod === paymentMethod);
    }

    if (customerEmail) {
      orders = orders.filter(order => 
        order.customerInfo?.email?.toLowerCase().includes(customerEmail.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.customerInfo?.fullName?.toLowerCase().includes(searchLower) ||
        order.customerInfo?.email?.toLowerCase().includes(searchLower) ||
        order.customerInfo?.phone?.includes(search)
      );
    }

    // Apply sorting
    orders.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    // Calculate summary statistics
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const response = {
      orders: paginatedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(orders.length / limit),
        totalOrders: orders.length,
        hasNext: endIndex < orders.length,
        hasPrev: startIndex > 0
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        statusCounts,
        averageOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length * 100) / 100 : 0
      },
      metadata: {
        cached: false,
        generatedAt: new Date().toISOString(),
        filters: { status, paymentMethod, customerEmail, search }
      }
    };

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const orders = await readOrders();
    const order = orders.find(o => o.id === req.params.id || o._id === req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  } catch (err) {
    next(err);
  }
});

// PUT update order status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes, trackingNumber, shippingProvider } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const orders = await readOrders();
    const index = orders.findIndex(o => o.id === req.params.id || o._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order with status history
    const previousStatus = orders[index].status;
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      ...(adminNotes && { adminNotes }),
      ...(trackingNumber && { trackingNumber }),
      ...(shippingProvider && { shippingProvider })
    };

    // Initialize status history if it doesn't exist
    if (!orders[index].statusHistory) {
      orders[index].statusHistory = [];
    }

    // Add status change to history
    orders[index].statusHistory.push({
      status,
      changedAt: new Date().toISOString(),
      changedBy: req.user.id,
      notes: adminNotes,
      previousStatus
    });

    orders[index] = { ...orders[index], ...updateData };

    await writeOrders(orders);

    // Clear relevant cache entries
    cache.clear();

    return res.json({
      message: 'Order updated successfully',
      order: orders[index],
      statusChange: {
        from: previousStatus,
        to: status
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT update order details (bulk update)
router.put('/:id', async (req, res, next) => {
  try {
    const orders = await readOrders();
    const index = orders.findIndex(o => o.id === req.params.id || o._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Define allowed fields for update
    const allowedFields = [
      'adminNotes', 
      'trackingNumber', 
      'shippingProvider', 
      'shippingInfo',
      'customerInfo'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    orders[index] = {
      ...orders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await writeOrders(orders);

    // Clear cache
    cache.clear();

    return res.json({
      message: 'Order updated successfully',
      order: orders[index]
    });
  } catch (err) {
    next(err);
  }
});

// DELETE order
router.delete('/:id', async (req, res, next) => {
  try {
    const orders = await readOrders();
    const orderIndex = orders.findIndex(o => o.id === req.params.id || o._id === req.params.id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const deletedOrder = orders[orderIndex];
    orders.splice(orderIndex, 1);
    
    await writeOrders(orders);

    // Clear cache
    cache.clear();

    return res.json({ 
      message: 'Order deleted successfully',
      deletedOrder: {
        id: deletedOrder.id || deletedOrder._id,
        orderNumber: deletedOrder.orderNumber,
        customerName: deletedOrder.customerInfo?.fullName
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST bulk status update
router.post('/bulk-status', async (req, res, next) => {
  try {
    const { orderIds, status, adminNotes } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Order IDs are required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const orders = await readOrders();
    const updatedOrders = [];
    const notFoundOrders = [];

    orderIds.forEach(orderId => {
      const index = orders.findIndex(o => o.id === orderId || o._id === orderId);
      
      if (index === -1) {
        notFoundOrders.push(orderId);
        return;
      }

      const previousStatus = orders[index].status;
      
      // Initialize status history if it doesn't exist
      if (!orders[index].statusHistory) {
        orders[index].statusHistory = [];
      }

      // Add status change to history
      orders[index].statusHistory.push({
        status,
        changedAt: new Date().toISOString(),
        changedBy: req.user.id,
        notes: adminNotes,
        previousStatus
      });

      orders[index] = {
        ...orders[index],
        status,
        updatedAt: new Date().toISOString(),
        ...(adminNotes && { adminNotes })
      };

      updatedOrders.push(orders[index]);
    });

    if (updatedOrders.length > 0) {
      await writeOrders(orders);
    }

    // Clear cache
    cache.clear();

    return res.json({
      message: `Updated ${updatedOrders.length} orders successfully`,
      updatedCount: updatedOrders.length,
      notFoundCount: notFoundOrders.length,
      notFoundOrders,
      updatedOrders: updatedOrders.map(order => ({
        id: order.id || order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerInfo?.fullName
      }))
    });
  } catch (err) {
    next(err);
  }
});

// GET order statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const cacheKey = 'orders:stats:summary';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const orders = await readOrders();
    
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const paymentMethodCounts = orders.reduce((acc, order) => {
      const method = order.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Recent orders (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentOrders = orders.filter(order => 
      new Date(order.createdAt || order.updatedAt) > oneWeekAgo
    ).length;

    const response = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders * 100) / 100 : 0,
      statusCounts,
      paymentMethodCounts,
      recentOrders,
      metadata: {
        cached: false,
        generatedAt: new Date().toISOString()
      }
    };

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return res.json(response);
  } catch (err) {
    next(err);
  }
});

// Clear cache endpoint
router.delete('/cache/clear', (req, res) => {
  const deletedCount = cache.size;
  cache.clear();
  res.json({ 
    message: 'Order cache cleared successfully', 
    deletedEntries: deletedCount 
  });
});

export default router;