import express from 'express';
import { body, validationResult } from 'express-validator';
import { createOrder, getGuestOrderById } from '../controllers/orderController.js';

const router = express.Router();

// ADD: Debug route at the TOP to avoid conflicts
router.get('/debug', (req, res) => {
  console.log('🔍 Guest orders debug route called from guestOrders.js');
  res.json({ 
    success: true, 
    message: 'Guest orders debug route is working from guestOrders.js',
    timestamp: new Date().toISOString(),
    features: {
      stockValidation: true,
      transactionSupport: true,
      emailConfirmation: true,
      guestCustomerSupport: true
    }
  });
});

// ADD: Debug validation route to test payload structure
router.post('/debug-validation', validateGuestOrder, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔍 DEBUG VALIDATION ERRORS:', errors.array());
      console.log('🔍 RECEIVED BODY:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Validation failed - DEBUG',
        details: errors.array(),
        receivedBody: req.body
      });
    }

    res.json({
      success: true,
      message: 'Validation passed!',
      receivedBody: req.body
    });
  } catch (error) {
    console.error('Debug validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug validation failed'
    });
  }
});

// Validation rules for guest orders - MATCHES FRONTEND
const validateGuestOrder = [
  body('customerInfo.fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('customerInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('customerInfo.phone')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Valid phone number is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Cart must contain at least one item'),
  body('items.*.name')
    .notEmpty()
    .withMessage('Product name is required'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Valid price is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Valid quantity is required'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Valid total amount is required')
];

// POST /api/orders/guest - Create a guest order
router.post('/', validateGuestOrder, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      items,
      customerInfo,
      deliveryOption,
      pickupLocation,
      pickupMtaaniLocation,
      paymentMethod,
      totalAmount,
      orderNumber
    } = req.body;

    console.log('🛒 Creating guest order with items:', items.length);

    // Transform frontend data to match Order model
    const products = items.map(item => ({
      product: item.productId || item.id,
      quantity: item.quantity,
      productName: item.name,
      productPrice: item.price,
      productImage: item.imageUrl || (item.images && item.images[0]?.url) || item.image || ''
    }));

    // Determine pickup location based on delivery option
    let pickupLocationId = null;
    if (deliveryOption === 'store-pickup') {
      pickupLocationId = pickupLocation;
    } else if (deliveryOption === 'pickupmtaani') {
      pickupLocationId = pickupMtaaniLocation;
    }

    // Map delivery options
    const deliveryOptionMap = {
      'store-pickup': 'Standard',
      'door-to-door': 'Express', 
      'pickupmtaani': 'PickupMtaani'
    };

    const mappedDeliveryOption = deliveryOptionMap[deliveryOption] || 'Standard';

    // Create request body for the controller
    const orderData = {
      guestCustomer: {
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address || ''
      },
      products,
      totalAmount,
      deliveryOption: mappedDeliveryOption,
      pickupLocationId,
      paymentMethod: paymentMethod || 'Unknown',
      orderNumber: orderNumber,
      status: 'Pending'
    };

    // Mock req.user for controller compatibility
    const mockReq = {
      body: orderData,
      user: null // No user for guest orders
    };

    // Use the shared controller
    await createOrder(mockReq, res);

  } catch (error) {
    console.error('❌ Guest order creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/orders/guest/:orderId - Get guest order by ID
router.get('/:orderId', getGuestOrderById);

export default router;