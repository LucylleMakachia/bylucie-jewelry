import Order from '../models/Order.js';
import Product from '../models/Product.js'; // ADD IMPORT
import mongoose from 'mongoose'; // ADD IMPORT
import { sendEmail } from '../services/emailService.js';

export async function createOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user,               // For logged-in users, if available
      guestCustomer,      // Guest customer info (optional)
      products,
      totalAmount,
      deliveryOption,
      pickupLocationId,
      status,
      paymentMethod,      // ADD payment method
      orderNumber,        // ADD order number
    } = req.body;

    console.log('📦 Creating order with data:', {
      user: user ? 'logged-in' : 'guest',
      productsCount: products?.length,
      totalAmount,
      deliveryOption
    });

    // 🔒 STOCK VALIDATION - Check stock before creating order
    console.log('📦 Validating stock for order...');
    const stockValidationErrors = [];

    for (const item of products) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        stockValidationErrors.push({
          productId: item.product,
          productName: item.productName,
          error: 'Product not found'
        });
        continue;
      }

      const availableStock = product.stock || 0;
      const requestedQuantity = item.quantity || 0;

      console.log(`📦 Product ${item.productName}: Available ${availableStock}, Requested ${requestedQuantity}`);

      if (availableStock < requestedQuantity) {
        stockValidationErrors.push({
          productId: item.product,
          productName: item.productName,
          requested: requestedQuantity,
          available: availableStock,
          error: 'Insufficient stock'
        });
      }
    }

    // If any stock issues, abort the transaction
    if (stockValidationErrors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      
      console.log('❌ Stock validation failed:', stockValidationErrors);
      
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock for some items',
        outOfStockItems: stockValidationErrors,
        message: 'Some items in your cart are out of stock. Please update your cart and try again.'
      });
    }

    // 📉 UPDATE STOCK - Deduct quantities from inventory
    console.log('📉 Updating product stock...');
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { stock: -item.quantity }
        },
        { session }
      );
      console.log(`➖ Reduced stock for ${item.productName} by ${item.quantity}`);
    }

    // Build order data conditionally for guest or user
    const orderData = {
      products,
      totalAmount,
      deliveryOption: deliveryOption || 'Standard',
      pickupLocationId: pickupLocationId || null,
      status: status || 'Pending',
      paymentMethod: paymentMethod || 'Unknown',
      orderNumber: orderNumber || generateOrderNumber(),
    };

    if (req.user?.userId) {
      orderData.user = req.user.userId;
    } else if (guestCustomer) {
      orderData.guestCustomer = guestCustomer;
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        error: 'User or guest customer information required' 
      });
    }

    const order = new Order(orderData);
    await order.save({ session });

    // ✅ COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

    console.log('✅ Order created successfully:', order._id);

    // Send confirmation email
    const customerName = req.user?.name || (guestCustomer?.fullName || 'Customer');
    const customerEmail = req.user?.email || (guestCustomer?.email);

    if (customerEmail) {
      const emailContent = `
        <h1>Order Confirmation</h1>
        <p>Hi ${customerName},</p>
        <p>Thank you for your purchase! Your order <strong>${order.orderNumber}</strong> has been successfully placed.</p>
        <p>We will notify you when your order ships.</p>
        <p>Order Details:</p>
        <ul>
          ${order.products.map(p => `<li>${p.productName} x ${p.quantity} - KES ${p.productPrice}</li>`).join('')}
        </ul>
        <p>Total: KES ${order.totalAmount}</p>
        <p>Delivery: ${order.deliveryOption}</p>
        <p>Status: ${order.status}</p>
        <p>Best regards,<br />By Lucie Team</p>
      `;

      // Send confirmation email asynchronously without blocking the response
      sendEmail(customerEmail, `Order Confirmation - ${order.orderNumber}`, emailContent).catch(err => {
        console.error('Failed to send order confirmation email:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        customerInfo: order.guestCustomer || { name: customerName, email: customerEmail },
        deliveryOption: order.deliveryOption,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    // ❌ ABORT TRANSACTION ON ERROR
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Order creation failed:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(err.errors).map(error => error.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// Order number generator function
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

export async function getUserOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('products.product')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching orders' 
    });
  }
}

export async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id).populate('products.product');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    // Check if user owns this order or it's a guest order
    if (order.user && order.user.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
}

// NEW: Get guest order by ID (no authentication required)
export async function getGuestOrderById(req, res) {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id,
      guestCustomer: { $exists: true }
    }).populate('products.product');
    
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
  } catch (err) {
    console.error('Error fetching guest order:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
}