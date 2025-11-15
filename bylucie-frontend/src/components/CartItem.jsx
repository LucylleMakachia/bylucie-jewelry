import React from 'react';

const footerGreen = '#556b2f';

export default function CartItem({ item, updateQuantity, removeItem }) {
  // Fix image URL handling for the admin dashboard structure
  const getImageUrl = () => {
    console.log('CartItem image data:', item.images); // Debug log
    
    // Handle images array from admin dashboard
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const firstImage = item.images[0];
      
      // If image is an object with url property (from admin dashboard)
      if (typeof firstImage === 'object' && firstImage.url) {
        return firstImage.url;
      }
      
      // If image is a direct string URL
      if (typeof firstImage === 'string') {
        return firstImage;
      }
    }
    
    // Fallback to singular image property if exists
    if (item.image) {
      if (typeof item.image === 'object' && item.image.url) {
        return item.image.url;
      }
      if (typeof item.image === 'string') {
        return item.image;
      }
    }
    
    console.log('No valid image found for item:', item.id);
    return '';
  };

  // Fix price handling
  const getPrice = () => {
    if (typeof item.price === 'number') return item.price;
    if (typeof item.price === 'string') return parseFloat(item.price);
    return 0;
  };

  const imageUrl = getImageUrl();
  const price = getPrice();
  const total = price * item.quantity;

  // Fix quantity decrease logic
  const handleDecrease = () => {
    if (item.quantity <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <div className="flex items-center space-x-6 p-4 bg-white rounded shadow relative">
      {/* Product image - only render if we have a valid URL */}
      {imageUrl ? (
        <div className="w-24 h-24 flex-shrink-0">
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover rounded"
          />
        </div>
      ) : (
        <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs text-center">No Image</span>
        </div>
      )}
      
      {/* Product details */}
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-gray-500">{item.description}</p>
        )}
        <p className="text-lg font-semibold mt-2">KSH {price.toFixed(2)} each</p>
        <p className="text-md font-medium text-gray-700">
          Total: KSH {total.toFixed(2)}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDecrease}
          style={{ backgroundColor: footerGreen }}
          className="px-3 py-1 text-white rounded hover:opacity-90 transition"
          aria-label={`Decrease quantity of ${item.name}`}
        >
          -
        </button>
        <span className="px-3 py-1 border border-gray-300 rounded">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          style={{ backgroundColor: footerGreen }}
          className="px-3 py-1 text-white rounded hover:opacity-90 transition"
          aria-label={`Increase quantity of ${item.name}`}
        >
          +
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={() => removeItem(item.id)}
        style={{ backgroundColor: footerGreen }}
        className="ml-6 px-4 py-2 text-white rounded hover:opacity-90 transition"
        aria-label={`Remove ${item.name} from cart`}
      >
        Remove
      </button>
    </div>
  );
}