import React, { useState, useEffect } from 'react';

export default function CheckoutPaymentForm({ orderId, amount }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Poll payment status every 5 seconds after initiating payment
  useEffect(() => {
    let interval;
    if (paymentStatus === 'pending') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/mpesa/status/${orderId}`);
          const data = await res.json();
          if (data.status === 'Paid') {
            setPaymentStatus('paid');
            clearInterval(interval);
          } else if (data.status === 'Failed') {
            setPaymentStatus('failed');
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
          setPaymentStatus('error');
          clearInterval(interval);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentStatus, orderId]);

  async function handlePayment() {
    if (!phoneNumber.trim()) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setPaymentStatus('pending');

    try {
      const response = await fetch('/api/payments/mpesa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, amount, orderId }),
      });

      if (!response.ok) {
        throw new Error('Payment initiation failed');
      }

      const data = await response.json();
      console.log('Payment initiated:', data);
      // The actual payment prompt will be on user's phone via M-Pesa
    } catch (error) {
      console.error(error);
      alert('Failed to initiate payment');
      setPaymentStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="border p-6 rounded shadow-md max-w-md mx-auto">
      <h2 className="font-semibold text-lg mb-4">Pay with M-Pesa</h2>
      <label className="block mb-2 font-medium" htmlFor="phoneNumber">Phone Number</label>
      <input
        id="phoneNumber"
        type="tel"
        placeholder="2547XXXXXXXX"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        disabled={isLoading || paymentStatus === 'pending'}
      />
      <button
        onClick={handlePayment}
        disabled={isLoading || paymentStatus === 'pending'}
        className="bg-sunGold hover:bg-sunGoldHighlight text-creamBg px-6 py-2 rounded font-semibold w-full"
      >
        {isLoading ? 'Requesting Payment...' : 'Pay Now'}
      </button>

      {paymentStatus === 'paid' && (
        <p className="text-green-600 mt-4 font-semibold">Payment successful! Thank you for your purchase.</p>
      )}
      {paymentStatus === 'failed' && (
        <p className="text-red-600 mt-4 font-semibold">Payment failed or was cancelled. Please try again.</p>
      )}
      {paymentStatus === 'error' && (
        <p className="text-red-600 mt-4 font-semibold">An error occurred while checking payment status.</p>
      )}
    </div>
  );
}
