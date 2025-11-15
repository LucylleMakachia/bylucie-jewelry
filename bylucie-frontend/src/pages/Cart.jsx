import React, { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import CartItem from '../components/CartItem.jsx';
import CartSummary from '../components/CartSummary.jsx';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { cartItems, updateQuantity, removeItem } = useContext(CartContext);
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    // Directly navigate to checkout page without OTP verification
    navigate('/checkout');
  };

  return (
    <main className="p-6 bg-creamBg text-earthyBrownDark min-h-screen font-serif max-w-5xl mx-auto">
      <h1 className="font-heading text-3xl mb-8 text-[#b8860b] text-center">
        Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <p className="text-center text-lg">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-6">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            ))}
          </div>
          <div className="mt-10">
            <CartSummary 
              cartItems={cartItems} 
              onProceedToCheckout={handleProceedToCheckout}
            />
          </div>
        </>
      )}
    </main>
  );
}
