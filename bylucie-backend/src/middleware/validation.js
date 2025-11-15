import { body } from 'express-validator';

// Validation rules for guest orders - MATCHES FRONTEND
export const validateGuestOrder = [
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

// Simple validation for debug route (without express-validator)
export const validateGuestOrderSimple = (req, res, next) => {
  const { customerInfo, items, totalAmount } = req.body;
  
  console.log('🔍 Debug validation - Received body:', req.body);
  
  // Check required fields
  if (!customerInfo) {
    return res.status(400).json({
      success: false,
      error: 'Customer info is required',
      receivedBody: req.body
    });
  }
  
  if (!customerInfo.email || !customerInfo.email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Valid email is required',
      receivedBody: req.body
    });
  }
  
  if (!customerInfo.phone || customerInfo.phone.length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Valid phone number is required (min 10 characters)',
      receivedBody: req.body
    });
  }
  
  if (!customerInfo.fullName || customerInfo.fullName.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Full name must be at least 2 characters long',
      receivedBody: req.body
    });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Items array is required and must not be empty',
      receivedBody: req.body
    });
  }
  
  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.name || !item.name.trim()) {
      return res.status(400).json({
        success: false,
        error: `Item ${i + 1}: Product name is required`,
        receivedBody: req.body
      });
    }
    if (!item.price || item.price <= 0) {
      return res.status(400).json({
        success: false,
        error: `Item ${i + 1}: Valid price is required`,
        receivedBody: req.body
      });
    }
    if (!item.quantity || item.quantity < 1) {
      return res.status(400).json({
        success: false,
        error: `Item ${i + 1}: Valid quantity is required`,
        receivedBody: req.body
      });
    }
  }
  
  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid total amount is required',
      receivedBody: req.body
    });
  }
  
  console.log('✅ Debug validation passed');
  next();
};