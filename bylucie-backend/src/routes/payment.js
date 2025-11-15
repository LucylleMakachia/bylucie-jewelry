import express from 'express';
import {
  initiatePayment,
  handleCallback,
  getPaymentStatus,
  createPesapalOrder,
  pesapalCallback,
  createPayPalOrder,
  capturePayPalOrder
} from '../controllers/paymentController.js';
import { authenticateClerk } from '../middleware/clerkAuth.js';

const router = express.Router();

// M-Pesa routes (protected)
router.post('/mpesa/initiate', authenticateClerk, initiatePayment);
router.post('/mpesa/callback', handleCallback); // Usually called by M-Pesa, no auth
router.get('/mpesa/status/:orderId', authenticateClerk, getPaymentStatus);

// Pesapal routes
router.post('/pesapal/create-order', authenticateClerk, createPesapalOrder);
router.post('/pesapal/callback', pesapalCallback); // Pesapal IPN callback, no auth

// PayPal routes
router.post('/paypal/create-order', authenticateClerk, createPayPalOrder);
router.post('/paypal/capture-order', authenticateClerk, capturePayPalOrder);

export default router;
