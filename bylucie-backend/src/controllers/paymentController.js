import { initiateSTKPush } from '../services/daraja.js';
import Order from '../models/Order.js';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import axios from 'axios';

// PayPal REST API base URL depending on env
const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

// Get OAuth access token for PayPal REST API
async function getPayPalAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios({
    method: 'post',
    url: `${PAYPAL_API_BASE}/v1/oauth2/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: 'grant_type=client_credentials',
  });

  return response.data.access_token;
}

// Pesapal config & OAuth setup
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_SECRET;
const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL;
const PESAPAL_BASE_URL =
  process.env.PESAPAL_IS_LIVE === 'true' ? 'https://pay.pesapal.com' : 'https://cybqa.pesapal.com';

const oauth = OAuth({
  consumer: { key: PESAPAL_CONSUMER_KEY, secret: PESAPAL_CONSUMER_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

// M-Pesa STK Push initiation
export async function initiatePayment(req, res) {
  const { phoneNumber, amount, orderId } = req.body;
  try {
    const callbackURL = `${process.env.API_BASE_URL}/api/payments/mpesa/callback`;
    const response = await initiateSTKPush(
      phoneNumber,
      amount,
      orderId,
      'By Lucie Jewelry Payment',
      callbackURL
    );
    res.json(response);
  } catch (error) {
    console.error('Initiate Payment error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
}

// M-Pesa payment callback processing
export async function handleCallback(req, res) {
  try {
    const paymentResult = req.body;
    const orderId = paymentResult.Body.stkCallback.CallbackMetadata.Item.find(
      (item) => item.Name === 'BillRefNumber'
    ).Value;
    const statusCode = paymentResult.Body.stkCallback.ResultCode;
    await Order.findByIdAndUpdate(orderId, {
      status: statusCode === 0 ? 'Paid' : 'Payment Failed',
    });
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('Daraja callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
}

// Retrieve M-Pesa payment status by orderId
export async function getPaymentStatus(req, res) {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: order.status });
  } catch (error) {
    console.error('Get Payment Status error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment status' });
  }
}

// Pesapal order creation - generate payment URL
export async function createPesapalOrder(req, res) {
  try {
    const { amount, description, email, phoneNumber, reference } = req.body;
    const requestData = {
      url: `${PESAPAL_BASE_URL}/api/PostPesapalDirectOrderV4`,
      method: 'GET',
      data: {
        amount,
        description,
        type: 'MERCHANT',
        reference,
        first_name: 'CustomerFirst',
        last_name: 'CustomerLast',
        email,
        phone_number: phoneNumber,
        callback_url: PESAPAL_CALLBACK_URL,
      },
    };
    const authHeader = oauth.toHeader(oauth.authorize(requestData));
    const params = new URLSearchParams(requestData.data).toString();
    const paymentUrl = `${requestData.url}?${params}`;
    res.json({ paymentUrl });
  } catch (error) {
    console.error('Pesapal create order error:', error);
    res.status(500).json({ error: 'Failed to create Pesapal order' });
  }
}

// Pesapal payment callback handler
export async function pesapalCallback(req, res) {
  try {
    const { merchant_reference, tracking_id, status } = req.query;
    await Order.findOneAndUpdate(
      { reference: merchant_reference },
      { status: status === 'COMPLETED' ? 'Paid' : 'Payment Failed' }
    );
    res.status(200).send('OK');
  } catch (error) {
    console.error('Pesapal callback error:', error);
    res.status(500).send('Error');
  }
}

// PayPal create order using REST API
export async function createPayPalOrder(req, res) {
  try {
    const accessToken = await getPayPalAccessToken();
    const { items, total, returnUrl, cancelUrl } = req.body;

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
          },
          items: items.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
          })),
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v2/checkout/orders`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: orderData,
    });

    res.json({ orderID: response.data.id });
  } catch (error) {
    console.error('PayPal create order error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error creating PayPal order' });
  }
}

// PayPal capture order using REST API
export async function capturePayPalOrder(req, res) {
  try {
    const accessToken = await getPayPalAccessToken();
    const { orderID } = req.body;

    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    res.json({ status: response.data.status });
  } catch (error) {
    console.error('PayPal capture order error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error capturing PayPal order' });
  }
}
