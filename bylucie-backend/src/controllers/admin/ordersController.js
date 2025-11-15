import Order from '../../models/Order.js';
import mongoose from 'mongoose';

export async function getOrders(req, res, next) {
  try {
    const orders = await Order.find().populate('user').populate('products.product');
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    const order = await Order.findById(req.params.id).populate('user').populate('products.product');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    const { status, trackingNumber, shippingProvider } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingProvider) order.shippingProvider = shippingProvider;

    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function deleteOrder(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    next(error);
  }
}
