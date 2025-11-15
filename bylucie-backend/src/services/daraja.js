import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const consumerKey = process.env.SAFARICOM_DARAJA_CONSUMER_KEY;
const consumerSecret = process.env.SAFARICOM_DARAJA_CONSUMER_SECRET;

async function getAccessToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const { data } = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` },
  });
  return data.access_token;
}

async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc, callbackURL) {
  const token = await getAccessToken();
  const payload = {
    BusinessShortCode: process.env.SAFARICOM_DARAJA_SHORTCODE,
    Password: generatePassword(), // Implement per Daraja docs
    Timestamp: generateTimestamp(), // Implement date format
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: process.env.SAFARICOM_DARAJA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackURL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };
  const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export { initiateSTKPush };
