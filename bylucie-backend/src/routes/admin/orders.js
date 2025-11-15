import express from 'express';
import Order from '../../models/Order.js'; // ADD THIS IMPORT
import { authenticateClerk, requireAdmin } from '../../middleware/clerkAuth.js';

const router = express.Router();

// Apply Clerk authentication and admin authorization for all routes
router.use(authenticateClerk, requireAdmin);

// GET all orders with filtering, pagination, and sorting - USING MONGODB
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

    console.log('📦 Fetching orders from MongoDB...');

    // Build query for MongoDB
    let query = {};

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    if (customerEmail) {
      query.$or = [
        { 'guestCustomer.email': { $regex: customerEmail, $options: 'i' } },
        { 'user.email': { $regex: customerEmail, $options: 'i' } }
      ];
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { orderNumber: searchRegex },
        { 'guestCustomer.fullName': searchRegex },
        { 'guestCustomer.email': searchRegex },
        { 'guestCustomer.phone': searchRegex },
        { 'user.firstName': searchRegex },
        { 'user.lastName': searchRegex },
        { 'user.email': searchRegex }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with population
    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email phone') // Populate user data
      .populate('products.product', 'name images price') // Populate product data
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(); // Convert to plain objects

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    console.log(`📦 Found ${orders.length} orders from MongoDB`);

    // Calculate summary statistics
    const allOrders = await Order.find(query).lean();
    const totalRevenue = allOrders
      .filter(order => order.status === 'Delivered' || order.status === 'delivered')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const statusCounts = allOrders.reduce((acc, order) => {
      const status = order.status || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const response = {
      success: true,
      orders: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
        hasNext: (page * limit) < totalOrders,
        hasPrev: page > 1
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        statusCounts,
        averageOrderValue: allOrders.length > 0 ? Math.round(totalRevenue / allOrders.length * 100) / 100 : 0,
        guestOrders: allOrders.filter(o => o.guestCustomer).length,
        userOrders: allOrders.filter(o => o.user).length
      },
      metadata: {
        source: 'mongodb',
        generatedAt: new Date().toISOString(),
        filters: { status, paymentMethod, customerEmail, search }
      }
    };

    return res.json(response);
  } catch (err) {
    console.error('❌ Error fetching orders from MongoDB:', err);
    next(err);
  }
});

// GET order by ID - USING MONGODB
router.get('/:id', async (req, res, next) => {
  try {
    console.log(`📦 Fetching order ${req.params.id} from MongoDB...`);
    
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('products.product', 'name images price');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    return res.json({ 
      success: true,
      order 
    });
  } catch (err) {
    console.error('❌ Error fetching order from MongoDB:', err);
    next(err);
  }
});

// PUT update order status - USING MONGODB
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes, trackingNumber, shippingProvider } = req.body;
    
    console.log(`🔄 Updating order ${req.params.id} status to ${status}`);
    
    // Validate status
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order status' 
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Update order
    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();
    
    if (adminNotes) order.adminNotes = adminNotes;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingProvider) order.shippingProvider = shippingProvider;

    await order.save();

    // Populate the updated order for response
    const updatedOrder = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('products.product', 'name images price');

    return res.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
      statusChange: {
        from: previousStatus,
        to: status
      }
    });
  } catch (err) {
    console.error('❌ Error updating order status in MongoDB:', err);
    next(err);
  }
});

// PUT update order details (bulk update) - USING MONGODB
router.put('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Define allowed fields for update
    const allowedFields = [
      'adminNotes', 
      'trackingNumber', 
      'shippingProvider', 
      'shippingInfo',
      'guestCustomer'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    });

    order.updatedAt = new Date();
    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('products.product', 'name images price');

    return res.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (err) {
    console.error('❌ Error updating order in MongoDB:', err);
    next(err);
  }
});

// DELETE order - USING MONGODB
router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    return res.json({ 
      success: true,
      message: 'Order deleted successfully',
      deletedOrder: {
        id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.guestCustomer?.fullName || (order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown')
      }
    });
  } catch (err) {
    console.error('❌ Error deleting order from MongoDB:', err);
    next(err);
  }
});

// POST bulk status update - USING MONGODB
router.post('/bulk-status', async (req, res, next) => {
  try {
    const { orderIds, status, adminNotes } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Order IDs are required' 
      });
    }

    if (!status) {
      return res.status(400).json({ 
        success: false,
        error: 'Status is required' 
      });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order status' 
      });
    }

    const updateResult = await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { 
          status: status,
          updatedAt: new Date(),
          ...(adminNotes && { adminNotes })
        }
      }
    );

    // Fetch updated orders
    const updatedOrders = await Order.find({ _id: { $in: orderIds } })
      .populate('user', 'firstName lastName email phone')
      .populate('products.product', 'name images price');

    return res.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} orders successfully`,
      updatedCount: updateResult.modifiedCount,
      updatedOrders: updatedOrders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.guestCustomer?.fullName || (order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown')
      }))
    });
  } catch (err) {
    console.error('❌ Error bulk updating orders in MongoDB:', err);
    next(err);
  }
});

// GET order statistics - USING MONGODB
router.get('/stats/summary', async (req, res, next) => {
  try {
    console.log('📊 Fetching order statistics from MongoDB...');

    const totalOrders = await Order.countDocuments();
    const guestOrders = await Order.countDocuments({ guestCustomer: { $exists: true } });
    const userOrders = await Order.countDocuments({ user: { $exists: true } });

    // Calculate revenue from delivered orders
    const deliveredOrders = await Order.find({ 
      $or: [
        { status: 'Delivered' },
        { status: 'delivered' }
      ]
    });
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Status counts
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const statusCountsObj = {};
    statusCounts.forEach(item => {
      statusCountsObj[item._id] = item.count;
    });

    // Payment method counts
    const paymentMethodCounts = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentMethodCountsObj = {};
    paymentMethodCounts.forEach(item => {
      paymentMethodCountsObj[item._id] = item.count;
    });

    // Recent orders (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    const response = {
      success: true,
      totalOrders,
      guestOrders,
      userOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders * 100) / 100 : 0,
      statusCounts: statusCountsObj,
      paymentMethodCounts: paymentMethodCountsObj,
      recentOrders,
      metadata: {
        source: 'mongodb',
        generatedAt: new Date().toISOString()
      }
    };

    console.log('📊 Order statistics:', response);
    return res.json(response);
  } catch (err) {
    console.error('❌ Error fetching order statistics from MongoDB:', err);
    next(err);
  }
});

// Clear cache endpoint (kept for compatibility, but cache is removed)
router.delete('/cache/clear', (req, res) => {
  res.json({ 
    success: true,
    message: 'Cache system removed - now using direct MongoDB queries' 
  });
});

export default router;