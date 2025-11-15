import Order from '../../models/Order.js';
import mongoose from 'mongoose';

export async function getOrders(req, res, next) {
  try {
    console.log('📦 Fetching all orders for admin...');
    
    // Fetch ALL orders including guest orders
    const orders = await Order.find({})
      .populate('user', 'firstName lastName email phone') // Populate user data if exists
      .populate('products.product', 'name images price') // Populate product data
      .sort({ createdAt: -1 }); // Latest first

    console.log(`📦 Found ${orders.length} total orders`);

    // Transform orders to ensure consistent structure for frontend
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      return {
        ...orderObj,
        // Ensure guest customer info is preserved
        guestCustomer: orderObj.guestCustomer,
        // Ensure user info is preserved
        user: orderObj.user,
        // Ensure order number exists
        orderNumber: orderObj.orderNumber || `ORD-${orderObj._id.toString().slice(-8)}`,
        // Ensure status exists
        status: orderObj.status || 'pending',
        // Ensure products array exists
        products: orderObj.products || [],
        // Ensure total amount exists
        totalAmount: orderObj.totalAmount || 0
      };
    });

    console.log(`📦 Returning ${transformedOrders.length} transformed orders`);
    
    res.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length,
      guestOrders: transformedOrders.filter(o => o.guestCustomer).length,
      userOrders: transformedOrders.filter(o => o.user).length
    });
  } catch (error) {
    console.error('❌ Error fetching admin orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders',
      message: error.message 
    });
  }
}

export async function getOrderById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID' 
      });
    }
    
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('products.product', 'name images price');
      
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch order',
      message: error.message 
    });
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID' 
      });
    }
    
    const { status, trackingNumber, shippingProvider } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Update fields if provided
    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingProvider) order.shippingProvider = shippingProvider;

    await order.save();
    
    // Populate the updated order
    const updatedOrder = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('products.product', 'name images price');

    res.json({
      success: true,
      order: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order status',
      message: error.message 
    });
  }
}

export async function deleteOrder(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID' 
      });
    }
    
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete order',
      message: error.message 
    });
  }
}