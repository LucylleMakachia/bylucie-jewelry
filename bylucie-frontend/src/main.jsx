import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';  // Restored original global CSS import
import App from './App.jsx';
import { CartProvider } from './contexts/CartContext.jsx';

import './i18n'; // <-- Added this line to initialize i18n

// Remove AuthProvider as ClerkProvider replaces it

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Clerk publishable key is missing. Please add it to your .env file');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <CartProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CartProvider>
    </ClerkProvider>
  </StrictMode>
);
