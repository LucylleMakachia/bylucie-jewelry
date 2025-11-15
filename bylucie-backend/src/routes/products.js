import express from 'express';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import { getApprovedReviewsQuery, calculateReviewStats } from '../utils/reviewHelpers.js';

const router = express.Router();

function logError(context, err) {
  console.error(`[Product Router] ${context}:`, err.message || err);
}

// Background sync function for stale reviews
const syncProductReviewsIfStale = async (product) => {
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  const isStale = !product.lastReviewUpdate || 
                  (Date.now() - new Date(product.lastReviewUpdate).getTime()) > ONE_HOUR;
  
  if (isStale) {
    try {
      console.log(`🔄 Product ${product._id} reviews are stale, refreshing...`);
      await product.updateReviewStats();
      console.log(`✅ Product ${product._id} reviews refreshed`);
    } catch (error) {
      console.warn(`⚠️ Failed to refresh reviews for product ${product._id}:`, error.message);
    }
  }
};

// --- STOCK CHECK ENDPOINT (for checkout validation) ---
router.post('/stock-check', async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ 
        error: 'productIds array is required' 
      });
    }

    console.log('🔍 Stock check requested for products:', productIds);

    // Get products with current stock
    const products = await Product.find({ 
      _id: { $in: productIds } 
    }).select('_id name stock status');

    // Get pending orders for these products
    const pendingOrders = await Order.aggregate([
      {
        $match: {
          'products.product': { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) },
          status: 'pending' // Only count pending orders
        }
      },
      { $unwind: '$products' },
      {
        $match: {
          'products.product': { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $group: {
          _id: '$products.product',
          reservedQuantity: { $sum: '$products.quantity' }
        }
      }
    ]);

    // Convert pending orders to a map for easy lookup
    const reservedStockMap = {};
    pendingOrders.forEach(item => {
      reservedStockMap[item._id.toString()] = item.reservedQuantity;
    });

    const stockData = {};
    
    // Calculate available stock (current stock - reserved in pending orders)
    productIds.forEach(id => {
      const product = products.find(p => p._id.toString() === id);
      const reservedQuantity = reservedStockMap[id] || 0;
      
      if (!product) {
        stockData[id] = 0; // Product not found
      } else {
        // Available stock = current stock - reserved in pending orders
        const availableStock = Math.max(0, (product.stock || 0) - reservedQuantity);
        stockData[id] = product.status === 'active' ? availableStock : 0;
      }
    });

    console.log('📦 Stock data returned (accounting for pending orders):', stockData);
    console.log('📊 Pending orders reserve:', reservedStockMap);

    res.json(stockData);
  } catch (error) {
    console.error('❌ Stock check error:', error);
    res.status(500).json({ 
      error: 'Failed to check product stock',
      details: error.message 
    });
  }
});

// --- GET all active products (Public route) ---
router.get('/', async (req, res, next) => {
  try {
    console.log('📦 Public products route called');
    
    // Development-only logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Request details:', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent']
      });
    }
    
    // Add cache control for public content
    res.set('Cache-Control', 'public, max-age=300');
    
    // Simulate a small delay to test loading states
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const products = await Product.find({ 
      status: 'active' // Only return active products
    }).sort({ createdAt: -1 });
    
    // NEW: Enhance products with fresh review data
    const enhancedProducts = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        
        try {
          // Get fresh review count and rating
          const approvedReviews = await Review.find(getApprovedReviewsQuery(product._id));
          
          // Override with fresh data
          productObj.rating = approvedReviews.length > 0 
            ? parseFloat((approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length).toFixed(1))
            : 0;
          productObj.reviewCount = approvedReviews.length;
        } catch (error) {
          console.warn(`⚠️ Could not fetch fresh reviews for product ${product._id}:`, error.message);
          // Keep cached values if fresh fetch fails
        }
        
        return productObj;
      })
    );
    
    console.log(`📦 Found ${enhancedProducts.length} products with fresh review data`);
    
    res.json({ 
      products: enhancedProducts,
      message: 'Products retrieved successfully',
      count: enhancedProducts.length,
      timestamp: new Date().toISOString(),
      public: true
    });
    
  } catch (err) {
    logError('GET /', err);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: err.message 
    });
  }
});

// --- GET single product by ID (Public route) - IMPROVED ---
router.get('/:id', async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { includeReviews, reviewStatus = 'approved' } = req.query;
    
    console.log('📦 Public single product route called for ID:', productId, {
      includeReviews,
      reviewStatus
    });
    
    // Add cache control with shorter TTL for real-time review updates
    res.set('Cache-Control', 'public, max-age=60');
    
    const product = await Product.findOne({ 
      _id: productId,
      status: 'active'
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        id: productId,
        message: 'The requested product does not exist or is not active',
        public: true
      });
    }

    // NEW: Trigger background sync if reviews are stale
    syncProductReviewsIfStale(product).catch(console.error);

    // IMPROVED: Enhanced review fetching with centralized query logic
    let reviews = [];
    let reviewStats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    // Always fetch approved reviews to ensure fresh data
    try {
      const reviewQuery = getApprovedReviewsQuery(productId);
      
      reviews = await Review.find(reviewQuery)
        .sort({ createdAt: -1 })
        .select('userName userEmail rating comment createdAt approved status mediaUrls');
      
      console.log(`📝 Found ${reviews.length} approved reviews for product ${productId}`);
      
      // Use centralized statistics calculation
      reviewStats = calculateReviewStats(reviews);
      
    } catch (reviewError) {
      console.warn('⚠️ Could not fetch reviews, using product cache:', reviewError.message);
      // Fall back to product's cached statistics
      reviewStats.averageRating = product.rating || 0;
      reviewStats.totalReviews = product.reviewCount || 0;
    }

    // Convert product to plain object
    const productWithReviews = product.toObject();
    
    // Always include approved reviews in response
    productWithReviews.reviews = reviews;
    
    // Override cached statistics with fresh data
    productWithReviews.rating = reviewStats.averageRating;
    productWithReviews.reviewCount = reviewStats.totalReviews;
    productWithReviews.reviewStats = reviewStats;

    res.json({
      product: productWithReviews,
      message: 'Product retrieved successfully',
      public: true,
      reviewStats: reviewStats,
      timestamp: new Date().toISOString(),
      reviewFilter: {
        included: 'approved-only',
        totalFound: reviews.length,
        approvedCount: reviews.length // All are approved due to our query
      }
    });
    
  } catch (err) {
    logError(`GET /${req.params.id}`, err);
    
    // Handle invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid product ID',
        message: 'The provided product ID is not valid'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// NEW: Dedicated reviews endpoint for a product
router.get('/:id/reviews', async (req, res) => {
  try {
    const productId = req.params.id;
    const { status = 'approved' } = req.query;
    
    console.log(`📝 Fetching reviews for product ${productId} with status: ${status}`);
    
    const product = await Product.findOne({ 
      _id: productId,
      status: 'active'
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        id: productId
      });
    }

    // IMPROVED: Use centralized query logic
    const reviewQuery = { productId: productId };
    
    if (status === 'approved') {
      Object.assign(reviewQuery, getApprovedReviewsQuery());
    } else if (status && status !== 'all') {
      reviewQuery.status = status;
    }
    
    const reviews = await Review.find(reviewQuery)
      .sort({ createdAt: -1 })
      .select('userName userEmail rating comment createdAt approved status mediaUrls');
    
    // IMPROVED: Use centralized statistics calculation
    const stats = calculateReviewStats(reviews);
    stats.totalReviews = reviews.length; // Include all reviews in total count
    stats.approvedReviews = reviews.filter(r => r.status === 'approved' || r.approved === true).length;

    res.json({
      success: true,
      productId: productId,
      productName: product.name,
      reviews: reviews,
      stats: stats,
      filters: {
        status: status,
        applied: reviewQuery
      },
      count: reviews.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ Error fetching product reviews:', err);
    res.status(500).json({ 
      error: 'Failed to fetch product reviews',
      message: err.message 
    });
  }
});

// Shared handler for refresh reviews
const handleRefreshReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('🔄 Force refreshing reviews for product:', productId);
    
    const product = await Product.findOne({ 
      _id: productId,
      status: 'active'
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        id: productId
      });
    }

    // IMPROVED: Use centralized query logic
    const reviews = await Review.find(getApprovedReviewsQuery(productId))
      .sort({ createdAt: -1 })
      .select('userName userEmail rating comment createdAt approved status');

    // IMPROVED: Use centralized statistics calculation
    const stats = calculateReviewStats(reviews);

    // Update the product with new statistics
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
      lastReviewUpdate: new Date()
    });

    res.json({
      success: true,
      message: 'Product reviews refreshed successfully',
      productId: productId,
      stats: {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews
      },
      reviewsCount: reviews.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ Error refreshing product reviews:', err);
    res.status(500).json({ 
      error: 'Failed to refresh product reviews',
      message: err.message 
    });
  }
};

// FIXED: Endpoint to force refresh product reviews (support both PUT and POST)
router.put('/:id/refresh-reviews', async (req, res) => {
  await handleRefreshReviews(req, res);
});

router.post('/:id/refresh-reviews', async (req, res) => {
  await handleRefreshReviews(req, res);
});

// Add a health check endpoint for products route
router.get('/health/status', (req, res) => {
  res.json({ 
    status: 'healthy',
    route: 'products',
    public: true,
    timestamp: new Date().toISOString()
  });
});

export default router;