import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

const router = express.Router();

// ========== PUBLIC ROUTES (No authentication required) ==========

/**
 * ✅ GET /api/reviews
 * Get reviews with filtering (public route)
 */
router.get('/', async (req, res) => {
  try {
    const { productId, status = 'approved', limit = 50, page = 1 } = req.query;
    
    console.log('📝 Public reviews route called:', { productId, status, limit, page });

    // Build query - only show approved reviews to public
    const query = {
      $or: [
        { status: 'approved' },
        { 
          $and: [
            { status: { $exists: false } },
            { approved: true }
          ]
        }
      ]
    };
    
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ 
          error: 'Invalid product ID format',
          productId 
        });
      }
      query.productId = productId;
    }

    const reviews = await Review.find(query)
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        productId,
        status: 'approved' // Always approved for public
      }
    });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reviews',
      message: error.message 
    });
  }
});

/**
 * ✅ GET /api/reviews/stats
 * Get review statistics (public route)
 */
router.get('/stats', async (req, res) => {
  try {
    const { productId } = req.query;

    const query = {
      $or: [
        { status: 'approved' },
        { 
          $and: [
            { status: { $exists: false } },
            { approved: true }
          ]
        }
      ]
    };

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ 
          error: 'Invalid product ID format',
          productId 
        });
      }
      query.productId = productId;
    }

    const [stats] = await Review.aggregate([
      { $match: query },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: '$rating' },
              },
            },
          ],
          ratingDistribution: [
            { $group: { _id: '$rating', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const summary = stats.summary[0] || { totalReviews: 0, averageRating: 0 };
    const ratingDist = stats.ratingDistribution.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalReviews: summary.totalReviews,
        averageRating: parseFloat(summary.averageRating?.toFixed(1)) || 0,
        ratingDistribution: ratingDist,
      },
      productId: productId || 'all'
    });

  } catch (error) {
    console.error('❌ Error fetching review stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch review statistics',
      message: error.message 
    });
  }
});

/**
 * ✅ POST /api/reviews
 * Create a new review (public route)
 */
router.post('/', async (req, res) => {
  try {
    const { productId, userId, userName, userEmail, rating, comment, mediaUrls } = req.body;

    // Validate required fields
    if (!productId || !userName || !userEmail || !rating) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['productId', 'userName', 'userEmail', 'rating']
      });
    }

    // Validate product exists
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        error: 'Invalid product ID format',
        productId 
      });
    }

    // FIXED: Check if product exists and is active
    const product = await Product.findOne({ 
      _id: productId, 
      status: 'active' 
    });
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found or not available',
        productId 
      });
    }

    // Create review
    const review = new Review({
      productId,
      userId,
      userName,
      userEmail,
      rating: parseInt(rating),
      comment,
      mediaUrls: mediaUrls || [],
      status: 'pending', // New reviews start as pending
      approved: false
    });

    await review.save();

    console.log(`✅ New review created for product ${productId} by ${userEmail}`);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and awaiting moderation',
      review: {
        _id: review._id,
        productId: review.productId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating review:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create review',
      message: error.message 
    });
  }
});

export default router;