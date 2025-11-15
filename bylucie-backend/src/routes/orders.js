import express from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { authenticateClerk } from '../middleware/clerkAuth.js';
import { trackOrder } from '../middleware/analytics.js';

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

// Order number generator
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

// GET /api/orders - Get all orders (admin only)
router.get('/', authenticateClerk, async (req, res, next) => {
  try {
    const orders = await readOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders - Create new order (authenticated users)
router.post('/', authenticateClerk, async (req, res, next) => {
  try {
    const orders = await readOrders();

    const newOrder = {
      id: Date.now().toString(),
      userId: req.auth.userId,
      ...req.body,
      orderNumber: req.body.orderNumber || generateOrderNumber(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    await writeOrders(orders);

    // Track order for analytics
    await trackOrder({
      orderId: newOrder.id,
      totalAmount: newOrder.total,
      items: newOrder.cartItems || newOrder.items,
      customerInfo: newOrder.customerInfo || newOrder.shippingInfo
    }, req.auth.userId);

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (err) {
    console.error('Error in POST /api/orders:', err);
    next(err);
  }
});

// ⚠️ REMOVED: The conflicting /guest route - guest orders are now handled by guestOrders.js

// GET /api/orders/user - Get user's own orders
router.get('/user', authenticateClerk, async (req, res, next) => {
  try {
    const orders = await readOrders();
    const userOrders = orders.filter((o) => o.userId === req.auth.userId);
    res.json({ orders: userOrders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id - Get single order by id
router.get('/:id', authenticateClerk, async (req, res, next) => {
  try {
    const orders = await readOrders();
    const order = orders.find((o) => o.id === req.params.id);

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.auth.userId) return res.status(403).json({ error: 'Access denied' });

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/orders/:id - Update order status (admin only)
router.put('/:id', authenticateClerk, async (req, res, next) => {
  try {
    const orders = await readOrders();
    const orderIndex = orders.findIndex((o) => o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await writeOrders(orders);

    res.json({
      message: 'Order updated successfully',
      order: orders[orderIndex]
    });
  } catch (err) {
    console.error('Error updating order:', err);
    next(err);
  }
});

export default router;