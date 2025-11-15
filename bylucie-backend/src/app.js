import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression'; 
import mongoose from 'mongoose';
import { getAuth } from '@clerk/express';

import apiLimiter from './middleware/rateLimiter.js';
import { validateRegister } from './middleware/validateRegister.js';
import { trackPageView } from './middleware/analytics.js';
import { clerkAuthMiddleware, authenticateClerk, attachClerkUser, requireAdmin } from './middleware/clerkAuth.js';

import verificationRoutes from './routes/verification.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import guestOrdersRoutes from './routes/guestOrders.js'; 
import pagesRoutes from './routes/pages.js';
import paymentRoutes from './routes/payment.js';
import pickupRoutes from './routes/pickup.js';
import userInteractionsRoutes from './routes/userInteractions.js';
import ipApiRoutes from './routes/ipApi.js';
import wishlistRoutes from './routes/wishlist.js';

// Import public reviews route
import reviewsRoutes from './routes/reviews.js';

// ADD: Import upload routes
import uploadRoutes from './routes/upload.js';

import adminRoutes from './routes/admin/index.js';
import adminProductsRoutes from './routes/admin/products.js';
import adminOrdersRoutes from './routes/admin/orders.js';
import adminUsersRoutes from './routes/admin/users.js';
import adminPickupRoutes from './routes/admin/pickupLocations.js';
import adminAnalyticsRoutes from './routes/admin/analytics/index.js';
import adminReviewsRoutes from './routes/admin/reviews.js';
import adminWishlistRoutes from './routes/admin/wishlist.js';

dotenv.config();

// Validate required environment variables on startup
if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is required');
  process.exit(1);
}

const app = express();

// Update CORS to include both frontend ports
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      'http://127.0.0.1:5000',
      'http://localhost:5000',
      'http://127.0.0.1:5173',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'", "data:", "blob:"],
      },
    },
  })
);

app.use(compression());

// Body parsers early in pipeline
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.use(cookieParser());

app.use(morgan('dev'));

// 🔒 CRITICAL FIX: Apply Clerk middleware globally before any routes that use getAuth()
app.use(clerkAuthMiddleware);

app.use(trackPageView);
app.use(apiLimiter);

// Simple debug endpoint that doesn't require auth
app.get('/api/debug/simple', (req, res) => {
  res.json({ 
    message: 'Simple debug endpoint works',
    timestamp: new Date().toISOString(),
    backend: 'Express server on http://127.0.0.1:5000'
  });
});

// Debug auth endpoint - NOW WITH GLOBAL MIDDLEWARE
app.get('/api/debug/auth', (req, res) => {
  console.log('🔍 Debug auth endpoint called');
  
  try {
    const auth = getAuth(req);
    
    res.json({
      success: true,
      auth: {
        hasAuth: !!auth,
        userId: auth?.userId,
        sessionClaims: auth?.sessionClaims,
        publicMetadata: auth?.sessionClaims?.publicMetadata,
      },
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        cookie: req.headers.cookie ? 'Present' : 'Missing'
      },
      timestamp: new Date().toISOString(),
      backend: 'Express server on http://127.0.0.1:5000'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API status and info endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: 'http://127.0.0.1:5000',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    features: {
      authentication: true,
      payments: true,
      analytics: true,
      admin: true,
      guestOrders: true,
      geolocation: true,
      stockValidation: true,
      reviews: true,
      wishlist: true,
      fileUpload: true
    },
    endpoints: {
      public: [
        '/api/products', 
        '/api/products/stock-check',
        '/api/auth', 
        '/api/verification', 
        '/api/orders/guest', 
        '/api/external',
        '/api/reviews',
        '/api/upload'
      ],
      protected: ['/api/orders', '/api/payment', '/api/pickup', '/api/wishlist'],
      admin: ['/api/admin', '/api/admin/analytics', '/api/admin/reviews', '/api/admin/wishlist']
    }
  });
});

// Test admin endpoint with debug
app.post('/api/admin/debug-test', 
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin,
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Admin access granted',
      user: req.user 
    });
  }
);

// Add route logging middleware for debugging
app.use((req, res, next) => {
  // Log all API routes for debugging
  if (req.path.startsWith('/api/')) {
    console.log(`🌐 API Route: ${req.method} ${req.path}`);
  }
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'API is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: 'http://127.0.0.1:5000',
    documentation: '/api/status'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    server: 'http://127.0.0.1:5000'
  });
});

// ========== PUBLIC ROUTES (no authentication required) ==========

app.use('/api/verification', verificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
// Public reviews route - must be before protected routes
app.use('/api/reviews', reviewsRoutes);
// File upload route - public for reviews with media
app.use('/api/upload', uploadRoutes);
// Guest orders route (must be public - no authentication) - FIXED: Mount only guestOrdersRoutes
app.use('/api/orders/guest', guestOrdersRoutes);
// External API proxy routes (for ipapi.co and other external services)
app.use('/api/external', ipApiRoutes);

// ========== PROTECTED ROUTES (require authentication only) ==========

// FIXED: Mount ordersRoutes WITHOUT the conflicting /guest route
app.use('/api/orders', authenticateClerk, ordersRoutes);
app.use('/api/pages', authenticateClerk, pagesRoutes);
app.use('/api/payment', authenticateClerk, paymentRoutes);
app.use('/api/pickup', authenticateClerk, pickupRoutes);
app.use('/api/user-interactions', authenticateClerk, userInteractionsRoutes);

// FIXED: Wishlist routes with proper authentication
app.use('/api/wishlist', 
  (req, res, next) => {
    console.log(`💝 Wishlist route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  wishlistRoutes
);

// ========== ADMIN ROUTES (require admin privileges) ==========
// MOUNT MOST SPECIFIC ROUTES FIRST TO AVOID CONFLICTS

// FIXED: Admin reviews route - mount with correct path
app.use('/api/admin/reviews', 
  (req, res, next) => {
    console.log(`🛣️  Admin reviews route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin, 
  adminReviewsRoutes
);

// FIXED: Admin products route - mount with correct path
app.use('/api/admin/products', 
  (req, res, next) => {
    console.log(`🛣️  Admin products route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin, 
  adminProductsRoutes
);

// FIXED: Admin wishlist route - ensure proper mounting order
app.use('/api/admin/wishlist', 
  (req, res, next) => {
    console.log(`🛣️  Admin wishlist route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin, 
  adminWishlistRoutes
);

// Admin orders route
app.use('/api/admin/orders', 
  (req, res, next) => {
    console.log(`🛣️  Admin orders route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin, 
  adminOrdersRoutes
);

// Admin users route
app.use('/api/admin/users', 
  (req, res, next) => {
    console.log(`🛣️  Admin users route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin, 
  adminUsersRoutes
);

// Admin pickup locations route
app.use('/api/admin/pickup-locations', 
  (req, res, next) => {
    console.log(`🛣️  Admin pickup locations route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin, 
  adminPickupRoutes
);

// Admin analytics route
app.use('/api/admin/analytics', 
  (req, res, next) => {
    console.log(`🛣️  Admin analytics route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin, 
  adminAnalyticsRoutes
);

// General admin route (catch-all for /api/admin) - MOUNTED LAST
app.use('/api/admin', 
  (req, res, next) => {
    console.log(`🛣️  General admin route hit: ${req.method} ${req.originalUrl}`);
    next();
  },
  authenticateClerk,
  attachClerkUser,
  requireAdmin,
  adminRoutes
);

// ========== DEBUG ROUTES ==========

// Wishlist debug route
app.get('/api/wishlist/debug', 
  authenticateClerk,
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Wishlist debug route is working',
      user: req.auth?.userId,
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/wishlist',
        'POST /api/wishlist',
        'DELETE /api/wishlist/:productId',
        'GET /api/wishlist/check/:productId'
      ]
    });
  }
);

// Temporary debug routes to test the endpoints
app.get('/api/admin/wishlist/debug', 
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin,
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Admin wishlist debug route is working',
      user: req.user?.email,
      timestamp: new Date().toISOString(),
      expectedEndpoints: [
        'GET /api/admin/wishlist',
        'GET /api/admin/wishlist/user/:userId', 
        'GET /api/admin/wishlist/stats'
      ]
    });
  }
);

// NEW: Debug route for testing review approval
app.put('/api/admin/reviews/debug/:reviewId/approve', 
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin,
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Review approval debug route is working',
      reviewId: req.params.reviewId,
      user: req.user?.email,
      timestamp: new Date().toISOString()
    });
  }
);

app.get('/api/admin/reviews/debug', 
  authenticateClerk, 
  attachClerkUser, 
  requireAdmin,
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Reviews debug route is working',
      user: req.user?.email,
      timestamp: new Date().toISOString()
    });
  }
);

// NEW: Debug route for testing product review refresh
app.post('/api/products/:productId/refresh-reviews', 
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Product review refresh route is working',
      productId: req.params.productId,
      timestamp: new Date().toISOString()
    });
  }
);

// ADD: Upload debug route
app.get('/api/upload/debug', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Upload debug route is working',
    timestamp: new Date().toISOString(),
    features: {
      maxFileSize: '10MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'],
      maxFiles: 5
    }
  });
});

// ADD: Guest orders debug route - MUST BE DEFINED BEFORE ANY DYNAMIC ROUTES
app.get('/api/orders/guest/debug', (req, res) => {
  console.log('🔍 Guest orders debug route called');
  res.json({ 
    success: true, 
    message: 'Guest orders debug route is working',
    timestamp: new Date().toISOString(),
    features: {
      stockValidation: true,
      transactionSupport: true,
      emailConfirmation: true,
      guestCustomerSupport: true
    },
    expectedPayload: {
      items: 'Array of product objects',
      customerInfo: {
        fullName: 'String (required)',
        email: 'String (required)',
        phone: 'String (required)',
        address: 'String (optional)'
      },
      totalAmount: 'Number (required)',
      deliveryOption: 'store-pickup|door-to-door|pickupmtaani (required)',
      paymentMethod: 'String (required)',
      orderNumber: 'String (optional)'
    },
    endpoints: {
      'POST /api/orders/guest': 'Create guest order',
      'GET /api/orders/guest/:orderId': 'Get guest order by ID'
    }
  });
});

app.post('/api/register', validateRegister, (req, res, next) => {
  next();
});

// 404 handler - UPDATED: Include guest orders debug endpoint
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method,
    server: 'http://127.0.0.1:5000',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/status',
      'GET /api/debug/simple', 
      'GET /api/debug/auth',
      'GET /api/wishlist/debug',
      'GET /',
      'POST /api/admin/debug-test',
      'POST /api/orders/guest',
      'GET /api/orders/guest/debug', // ADDED
      'GET /api/external/ipapi',
      'GET /api/reviews',
      'GET /api/upload/debug',
      'POST /api/upload',
      'GET /api/admin/wishlist/debug',
      'GET /api/admin/wishlist',
      'GET /api/admin/wishlist/user/:userId',
      'GET /api/admin/wishlist/stats',
      'GET /api/admin/reviews/debug',
      'PUT /api/admin/reviews/debug/:reviewId/approve',
      'POST /api/products/:productId/refresh-reviews'
    ]
  });
});

// General error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack || err);

  const status = err.status || 500;
  const message = err.message || 'Server error';

  const response = { 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.details 
    })
  };

  res.status(status).json(response);
});

export default app;