import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartSummary({ cartItems, onProceedToCheckout }) {
  const navigate = useNavigate();

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'number' 
        ? item.price 
        : parseFloat(item.price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items to your cart before checkout.');
      return;
    }
    
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      navigate('/checkout', { state: { showToast: true } });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-earthyBrownLight">
      <h2 className="text-2xl font-heading text-[#b8860b] mb-4">Order Summary</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>KSH {subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>KSH {shipping.toFixed(2)}</span>
        </div>
        
        <hr className="my-3 border-earthyBrownLight" />
        
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>KSH {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-amber-50 rounded-lg">
        <h3 className="font-semibold text-amber-800 mb-2">Delivery Options Available</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>✓ Store Pickup - Free</li>
          <li>✓ Door-to-Door (Uber/Bolt) - Calculated at checkout</li>
          <li>✓ PickupMtaani Locations - KSH 99</li>
        </ul>
      </div>
      
      <button 
        onClick={handleCheckout}
        className="w-full mt-6 bg-earthyBrown text-white py-3 rounded hover:bg-earthyBrownDark transition-colors font-semibold"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}