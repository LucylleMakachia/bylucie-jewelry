import React, { useState, useContext, useEffect } from 'react';
import { CartContext } from '../contexts/CartContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '@clerk/clerk-react';

export default function Checkout() {
  const { cartItems, clearCart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, userId } = useAuth();

  const [step, setStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    phone: '',
    email: '',
  });
  const [deliveryOption, setDeliveryOption] = useState('store-pickup');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupMtaaniLocation, setPickupMtaaniLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [productStock, setProductStock] = useState({});

  // Store pickup locations
  const [storeLocations] = useState([
    { id: 'main-store', name: 'Main Store - Nairobi CBD', address: 'Moi Avenue, Nairobi CBD' },
    { id: 'westlands', name: 'Westlands Branch', address: 'Westlands Mall, Westlands' },
    { id: 'garden-city', name: 'Garden City Branch', address: 'Garden City Mall, Thika Road' }
  ]);

  // PickupMtaani locations
  const [pickupMtaaniLocations] = useState([
    { id: 'pm-nairobi-cbd', name: 'Nairobi CBD Hub', address: 'City Hall Way' },
    { id: 'pm-karen', name: 'Karen Pickup Point', address: 'Karen Shopping Centre' },
    { id: 'pm-ruaka', name: 'Ruaka Collection Point', address: 'Ruaka Town Centre' },
    { id: 'pm-westlands', name: 'Westlands Drop Point', address: 'Westlands Business District' }
  ]);

  // Check product stock on component mount
  useEffect(() => {
    checkProductStock();
  }, [cartItems]);

  // Function to check product stock
  const checkProductStock = async () => {
    if (cartItems.length === 0) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const productIds = cartItems.map(item => item.id);
      
      const res = await fetch(`${API_BASE_URL}/api/products/stock-check`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });

      if (res.ok) {
        const stockData = await res.json();
        setProductStock(stockData);
      } else {
        console.warn('Stock check failed, but continuing with checkout');
      }
    } catch (error) {
      console.error('Error checking product stock:', error);
    }
  };

  // Check if any product is out of stock
  const hasOutOfStockItems = () => {
    return cartItems.some(item => {
      const stock = productStock[item.id];
      return stock !== undefined && stock < item.quantity;
    });
  };

  // Get out of stock items for error messages
  const getOutOfStockItems = () => {
    return cartItems.filter(item => {
      const stock = productStock[item.id];
      return stock !== undefined && stock < item.quantity;
    });
  };

  // Get product image function
  const getProductImage = (product) => {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'object' && firstImage.url) {
        return firstImage.url;
      }
      if (typeof firstImage === 'string') {
        return firstImage;
      }
    }
    
    if (product.image) {
      return product.image;
    }
    
    return '/images/placeholder.jpg';
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.src = '/images/placeholder.jpg';
    e.target.alt = 'Image not available';
  };

  useEffect(() => {
    if (cartItems.length === 0 && !orderComplete) {
      navigate('/cart');
      return;
    }

    if (location.state?.showToast) {
      toast.info('Proceeding to checkout...', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  }, [location.state, cartItems, navigate, orderComplete]);

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    // Check stock before proceeding
    if (hasOutOfStockItems()) {
      const outOfStockItems = getOutOfStockItems();
      const itemNames = outOfStockItems.map(item => item.name).join(', ');
      toast.error(`Some items in your cart are out of stock: ${itemNames}. Please update your cart.`);
      return false;
    }

    const { fullName, address, phone, email } = shippingInfo;
    
    if (deliveryOption === 'door-to-door') {
      if (!fullName.trim() || !address.trim() || !phone.trim() || !email.trim()) {
        toast.error('Please fill out all shipping information fields including address for door-to-door delivery.');
        return false;
      }
    } else {
      if (!fullName.trim() || !phone.trim() || !email.trim()) {
        toast.error('Please fill out name, phone, and email for order confirmation.');
        return false;
      }
    }
    
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // Check stock again
    if (hasOutOfStockItems()) {
      const outOfStockItems = getOutOfStockItems();
      const itemNames = outOfStockItems.map(item => item.name).join(', ');
      toast.error(`Some items in your cart are out of stock: ${itemNames}. Please update your cart.`);
      return false;
    }

    if (deliveryOption === 'store-pickup' && !pickupLocation) {
      toast.error('Please select a store pickup location.');
      return false;
    }
    if (deliveryOption === 'pickupmtaani' && !pickupMtaaniLocation) {
      toast.error('Please select a PickupMtaani location.');
      return false;
    }
    if (deliveryOption === 'door-to-door' && !shippingInfo.address.trim()) {
      toast.error('Please enter your delivery address for door-to-door delivery.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step >= 3) return;

    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  // Order number generator
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}-${random}`;
  };

  const handleCompleteOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    // Final stock check before submitting
    if (hasOutOfStockItems()) {
      const outOfStockItems = getOutOfStockItems();
      const itemNames = outOfStockItems.map(item => item.name).join(', ');
      toast.error(`Cannot complete order. The following items are out of stock: ${itemNames}. Please update your cart.`);
      return;
    }

    setSubmitting(true);
    try {
      // FIXED: Use 'items' instead of 'cartItems' to match backend validation
      const orderPayload = {
        items: cartItems.map(item => ({
          id: item.id,
          productId: item.id, // Include both for compatibility
          name: item.name,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price),
          quantity: parseInt(item.quantity),
          size: item.size || null,
          color: item.color || null,
          imageUrl: getProductImage(item),
          images: item.images || []
        })),
        customerInfo: {
          fullName: shippingInfo.fullName.trim(),
          email: shippingInfo.email.trim(),
          phone: shippingInfo.phone.trim(),
          address: shippingInfo.address?.trim() || ''
        },
        deliveryOption,
        pickupLocation: deliveryOption === 'store-pickup' ? pickupLocation : null,
        pickupMtaaniLocation: deliveryOption === 'pickupmtaani' ? pickupMtaaniLocation : null,
        paymentMethod,
        totalAmount: parseFloat(calculateTotal()), // FIXED: Use totalAmount instead of total
        orderNumber: generateOrderNumber(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        isGuestOrder: !isSignedIn,
        userId: isSignedIn ? userId : null
      };

      console.log('🔍 DEBUG - Complete order payload being sent:', JSON.stringify(orderPayload, null, 2));
      console.log('Submitting order to API:', { 
        isSignedIn, 
        userId,
        itemCount: cartItems.length 
      });

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      
      // 🔒 CRITICAL: Final server-side stock validation to prevent race conditions
      console.log('🔒 Performing final server-side stock validation...');
      const stockRes = await fetch(`${API_BASE_URL}/api/products/stock-check`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: cartItems.map(item => item.id) }),
      });

      if (stockRes.ok) {
        const latestStockData = await stockRes.json();
        
        // Check if any items became out of stock since we started checkout
        const newlyOutOfStockItems = cartItems.filter(item => {
          const latestStock = latestStockData[item.id];
          return latestStock !== undefined && latestStock < item.quantity;
        });

        if (newlyOutOfStockItems.length > 0) {
          const itemNames = newlyOutOfStockItems.map(item => item.name).join(', ');
          throw new Error(`Some items were purchased by other customers while you were checking out: ${itemNames}. Please update your cart.`);
        }
      }

      // Choose the appropriate endpoint based on authentication
      const endpoint = isSignedIn 
        ? `${API_BASE_URL}/api/orders`
        : `${API_BASE_URL}/api/orders/guest`;

      console.log(`Using endpoint: ${endpoint} for ${isSignedIn ? 'signed-in user' : 'guest'}`);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      // ENHANCED ERROR HANDLING - Get detailed validation errors
      console.log('📋 Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorData;
        const responseText = await res.text();
        
        try {
          errorData = JSON.parse(responseText);
          console.error('❌ Server validation errors:', errorData);
        } catch (e) {
          console.error('❌ Server returned non-JSON response:', responseText);
          errorData = { error: responseText || 'Unknown server error' };
        }

        // Handle different types of validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationMessages = errorData.details.map(detail => {
            if (typeof detail === 'string') return detail;
            if (detail.msg) return detail.msg;
            if (detail.message) return detail.message;
            return JSON.stringify(detail);
          }).join(', ');
          
          throw new Error(`Validation failed: ${validationMessages}`);
        }
        
        if (errorData.error && errorData.error.includes('stock') || 
            errorData.message && errorData.message.includes('stock')) {
          throw new Error(errorData.error || errorData.message);
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      console.log('✅ Order created successfully via API:', result);

      toast.success(`Order completed successfully! ${isSignedIn ? 'Your order has been saved to your account.' : ''}`, {
        position: 'bottom-right',
        autoClose: 3000,
      });

      clearCart();
      setOrderComplete(true);
      
    } catch (err) {
      console.error('Order submission error:', err);
      
      // More user-friendly error messages
      let userMessage = err.message;
      
      if (err.message.includes('Server error') || err.message.includes('unexpected response')) {
        userMessage = 'Unable to connect to the server. Please check if the backend server is running.';
      } else if (err.message.includes('Failed to fetch')) {
        userMessage = 'Network error. Please check your connection.';
      } else if (err.message.includes('stock') || err.message.includes('purchased by other customers')) {
        userMessage = err.message;
        // Refresh stock data to show current availability
        checkProductStock();
      }
      
      toast.error(`Failed to create order: ${userMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get Clerk token (if needed)
  const getClerkToken = async () => {
    return null; // Placeholder - implement based on your auth setup
  };

  const getDeliveryInstructions = () => {
    switch (deliveryOption) {
      case 'store-pickup':
        return 'Your order will be ready for pickup within 2 hours. Please bring your ID and order confirmation.';
      case 'door-to-door':
        return 'Door-to-door delivery via Uber/Bolt. Delivery time: 1-3 hours. You will receive tracking information.';
      case 'pickupmtaani':
        return 'Your order will be delivered to the selected PickupMtaani location within 24 hours. You will receive an SMS when ready for pickup.';
      default:
        return '';
    }
  };

  // Show stock status in order summary
  const renderStockStatus = (item) => {
    const stock = productStock[item.id];
    if (stock === undefined) return null;
    
    if (stock < item.quantity) {
      return (
        <div className="text-red-600 text-sm mt-1 font-semibold">
          ⚠️ Only {stock} available (including pending orders)
        </div>
      );
    }
    
    if (stock < 5) {
      return (
        <div className="text-amber-600 text-sm mt-1">
          ⚠️ Low stock: {stock} available (including pending orders)
        </div>
      );
    }
  
    return null;
  };

  return (
    <main className="p-6 bg-creamBg text-earthyBrownDark min-h-screen max-w-5xl mx-auto font-serif">
      <h1 className="font-heading text-3xl mb-8 text-[#b8860b] text-center tracking-wide">Checkout</h1>

      {/* User status indicator */}
      {isSignedIn && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">
            ✅ You are signed in. Your order will be saved to your account.
          </p>
        </div>
      )}

      {/* Out of stock warning */}
      {hasOutOfStockItems() && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Stock Issue Detected</h3>
              <p className="text-red-700">
                Some items in your cart are out of stock. Please update your cart before proceeding.
              </p>
              {getOutOfStockItems().map(item => {
                const stock = productStock[item.id];
                return (
                  <div key={item.id} className="text-red-600 text-sm mt-1">
                    • {item.name}: Only {stock} available including pending orders (you requested {item.quantity})
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition whitespace-nowrap ml-4"
            >
              Back to Cart
            </button>
          </div>
        </div>
      )}

      {/* Order Summary Sidebar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
        {cartItems.map(item => {
          const productImage = getProductImage(item);
          return (
            <div key={item.id} className="flex items-center py-2 border-b">
              <img 
                src={productImage} 
                alt={item.name}
                className="w-12 h-12 object-cover rounded mr-3"
                onError={handleImageError}
              />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                {renderStockStatus(item)}
              </div>
              <span className="font-semibold">KSH {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          );
        })}
        <div className="flex justify-between font-semibold text-lg mt-3">
          <span>Total:</span>
          <span>KSH {calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-[#b8860b] max-w-3xl mx-auto">
        {orderComplete ? (
          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">Thank you for your order!</h2>
            <p className="mb-4">
              Your order has been placed successfully.
              {isSignedIn && ' You can view your order history in your account.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#b8860b] text-white px-6 py-2 rounded hover:bg-[#997500] transition"
            >
              Continue Shopping
            </button>
          </section>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="flex justify-between mb-8">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= stepNumber ? 'bg-[#b8860b] text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  <span className="text-sm mt-1">
                    {stepNumber === 1 && 'Contact'}
                    {stepNumber === 2 && 'Delivery'}
                    {stepNumber === 3 && 'Payment'}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Contact Information */}
            {step === 1 && (
              <section>
                <h2 className="font-semibold text-xl mb-6">Contact Information</h2>
                <form className="space-y-6">
                  <label className="block font-semibold">
                    Full Name *
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={shippingInfo.fullName}
                      onChange={handleShippingChange}
                      className="w-full p-3 mt-1 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
                      required
                    />
                  </label>
                  <label className="block font-semibold">
                    Email *
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={handleShippingChange}
                      className="w-full p-3 mt-1 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
                      required
                    />
                  </label>
                  <label className="block font-semibold">
                    Phone Number *
                    <input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      className="w-full p-3 mt-1 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
                      placeholder="+254 XXX XXX XXX"
                      required
                    />
                  </label>
                  <label className="block font-semibold">
                    Delivery Address {deliveryOption === 'door-to-door' && '*'}
                    <textarea
                      id="address"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleShippingChange}
                      className="w-full p-3 mt-1 border border-[#b8860b] rounded-lg h-24 resize-none focus:outline-none focus:border-[#ff8c00] transition"
                      placeholder={deliveryOption === 'door-to-door' ? 'Full delivery address for Uber/Bolt delivery' : 'Optional for pickup orders'}
                    />
                  </label>
                </form>
                
                <button
                  onClick={hasOutOfStockItems() ? () => navigate('/cart') : handleNextStep}
                  className={`w-full py-3 mt-4 rounded-lg transition font-semibold text-lg ${
                    hasOutOfStockItems() 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-[#b8860b] text-white hover:bg-[#997500]'
                  }`}
                >
                  {hasOutOfStockItems() ? 'Back to Cart to Fix Stock Issues' : 'Next: Delivery Options'}
                </button>
              </section>
            )}

            {/* Step 2: Delivery Options */}
            {step === 2 && (
              <section>
                <h2 className="font-semibold text-xl mb-6">Delivery Options</h2>
                
                <div className="space-y-4 mb-6">
                  <label className="block p-4 border-2 border-[#b8860b] rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="store-pickup"
                      checked={deliveryOption === 'store-pickup'}
                      onChange={() => setDeliveryOption('store-pickup')}
                      className="mr-3"
                    />
                    <span className="font-semibold">Store Pickup</span>
                    <p className="text-sm text-gray-600 mt-1">Pick up from our physical stores - Free</p>
                  </label>

                  <label className="block p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="door-to-door"
                      checked={deliveryOption === 'door-to-door'}
                      onChange={() => setDeliveryOption('door-to-door')}
                      className="mr-3"
                    />
                    <span className="font-semibold">Door-to-Door Delivery (Uber/Bolt)</span>
                    <p className="text-sm text-gray-600 mt-1">Direct delivery to your location - Delivery fee calculated at checkout</p>
                  </label>

                  <label className="block p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="pickupmtaani"
                      checked={deliveryOption === 'pickupmtaani'}
                      onChange={() => setDeliveryOption('pickupmtaani')}
                      className="mr-3"
                    />
                    <span className="font-semibold">PickupMtaani Locations</span>
                    <p className="text-sm text-gray-600 mt-1">Pick up from convenient PickupMtaani points - KSH 99</p>
                  </label>
                </div>

                {/* Store Pickup Locations */}
                {deliveryOption === 'store-pickup' && (
                  <div className="mb-6">
                    <label className="block font-semibold mb-3">Select Store Location *</label>
                    <select
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
                      required
                    >
                      <option value="">Choose a store location</option>
                      {storeLocations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} - {location.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* PickupMtaani Locations */}
                {deliveryOption === 'pickupmtaani' && (
                  <div className="mb-6">
                    <label className="block font-semibold mb-3">Select PickupMtaani Location *</label>
                    <select
                      value={pickupMtaaniLocation}
                      onChange={(e) => setPickupMtaaniLocation(e.target.value)}
                      className="w-full p-3 border border-[#b8860b] rounded-lg focus:outline-none focus:border-[#ff8c00] transition"
                      required
                    >
                      <option value="">Choose a PickupMtaani location</option>
                      {pickupMtaaniLocations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} - {location.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delivery Instructions */}
                <div className="bg-amber-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-amber-800 mb-2">Delivery Information</h4>
                  <p className="text-amber-700 text-sm">{getDeliveryInstructions()}</p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold text-lg"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={hasOutOfStockItems() ? () => navigate('/cart') : handleNextStep}
                    className={`flex-1 py-3 rounded-lg transition font-semibold text-lg ${
                      hasOutOfStockItems()
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-[#b8860b] text-white hover:bg-[#997500]'
                    }`}
                  >
                    {hasOutOfStockItems() ? 'Back to Cart' : 'Next: Payment'}
                  </button>
                </div>
              </section>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <section>
                <h2 className="font-semibold text-xl mb-6">Payment</h2>

                <div className="space-y-4 mb-6">
                  <label className="block p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mpesa"
                      checked={paymentMethod === 'mpesa'}
                      onChange={() => setPaymentMethod('mpesa')}
                      className="mr-3"
                    />
                    <span className="font-semibold">M-Pesa</span>
                  </label>

                  <label className="block p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="mr-3"
                    />
                    <span className="font-semibold">Credit/Debit Card</span>
                  </label>

                  <label className="block p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="mr-3"
                    />
                    <span className="font-semibold">Bank Transfer</span>
                  </label>

                  <label className="block p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="mr-3"
                    />
                    <span className="font-semibold">Cash on Delivery</span>
                    <p className="text-sm text-gray-600 mt-1">Pay with cash when you receive your order</p>
                  </label>

                  <label className="block p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="mr-3"
                    />
                    <span className="font-semibold">PayPal</span>
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold text-lg"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={hasOutOfStockItems() ? () => navigate('/cart') : handleCompleteOrder}
                    disabled={!hasOutOfStockItems() && submitting}
                    className={`flex-1 py-3 rounded-lg transition font-semibold text-lg ${
                      hasOutOfStockItems()
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-[#b8860b] text-white hover:bg-[#997500] disabled:opacity-50'
                    }`}
                  >
                    {hasOutOfStockItems() ? 'Back to Cart' : (submitting ? 'Processing...' : 'Complete Order')}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </main>
  );
}