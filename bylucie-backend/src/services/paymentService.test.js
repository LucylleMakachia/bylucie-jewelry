import paymentService from '../../src/services/paymentService.js'; // Adjust path as needed
import Stripe from 'stripe';
import paypal from '@paypal/paypal-server-sdk';

jest.mock('stripe');
jest.mock('@paypal/paypal-server-sdk');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create Stripe paymentIntent correctly', async () => {
    const mockPaymentIntent = { client_secret: 'test_secret' };
    Stripe.prototype.paymentIntents = {
      create: jest.fn().mockResolvedValue(mockPaymentIntent),
    };

    const paymentIntent = await paymentService.createStripePaymentIntent({
      amount: 1000,
      currency: 'usd',
      receipt_email: 'test@example.com',
    });
    expect(paymentIntent.client_secret).toBe('test_secret');
    expect(Stripe.prototype.paymentIntents.create).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
      receipt_email: 'test@example.com',
      automatic_payment_methods: { enabled: true },
    });
  });

  test('should create PayPal order and return approval URL', async () => {
    const mockExecute = jest.fn().mockResolvedValue({
      result: {
        links: [
          { rel: 'approval_url', href: 'https://paypal.com/approve' },
        ],
      },
    });
    paypal.core.PayPalHttpClient = jest.fn(() => ({ execute: mockExecute }));
    paypal.orders.OrdersCreateRequest = jest.fn(() => ({
      prefer: jest.fn(),
      requestBody: jest.fn(),
    }));

    const paymentServiceModule = require('../../src/services/paymentService.js');
    const approvalUrl = await paymentServiceModule.createPayPalOrder({
      total: '10.00',
      currency: 'USD',
    });

    expect(approvalUrl).toBe('https://paypal.com/approve');
    expect(mockExecute).toHaveBeenCalled();
  });

  // Add tests for error scenarios, capture order, etc.
});
