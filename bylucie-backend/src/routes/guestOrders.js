import express from 'express';
import { validationResult } from 'express-validator';
import { createOrder, getGuestOrderById } from '../controllers/orderController.js';
import { validateGuestOrder, validateGuestOrderSimple } from '../middleware/validation.js';

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
router.post('/debug-validation', validateGuestOrderSimple, async (req, res) => {
  try {
    console.log('🔍 Debug validation route called with body:', req.body);
    
    // Since we're using validateGuestOrderSimple which already does validation,
    // we just need to return success if we reached here
    res.json({
      success: true,
      message: 'Validation passed!',
      receivedBody: req.body,
      validation: {
        customerInfo: '✓ Valid',
        items: '✓ Valid',
        totalAmount: '✓ Valid',
        structure: '✓ Correct'
      }
    });
  } catch (error) {
    console.error('❌ Debug validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug validation failed',
      details: error.message
    });
  }
});

// POST /api/orders/guest - Create a guest order
router.post('/', validateGuestOrder, async (req, res) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        receivedBody: req.body
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
    console.log('📦 Delivery option:', deliveryOption);
    console.log('👤 Customer:', customerInfo.email);

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
      console.log('🏪 Store pickup location:', pickupLocationId);
    } else if (deliveryOption === 'pickupmtaani') {
      pickupLocationId = pickupMtaaniLocation;
      console.log('📍 Pickup Mtaani location:', pickupLocationId);
    }

    // Map delivery options
    const deliveryOptionMap = {
      'store-pickup': 'Standard',
      'door-to-door': 'Express', 
      'pickupmtaani': 'PickupMtaani'
    };

    const mappedDeliveryOption = deliveryOptionMap[deliveryOption] || 'Standard';
    console.log('🚚 Mapped delivery option:', mappedDeliveryOption);

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

    console.log('📤 Sending to order controller:', {
      productsCount: orderData.products.length,
      totalAmount: orderData.totalAmount,
      deliveryOption: orderData.deliveryOption
    });

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