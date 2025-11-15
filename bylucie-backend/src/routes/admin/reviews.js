import { getAuth } from '@clerk/express';
import express from 'express';
import mongoose from 'mongoose';
import Review from '../../models/Review.js';
import Product from '../../models/Product.js';
// ADD: Import authentication middleware and review helpers
import { authenticateClerk, attachClerkUser, requireAdmin } from '../../middleware/clerkAuth.js';
import { getApprovedReviewsQuery, calculateReviewStats } from '../../utils/reviewHelpers.js';

const router = express.Router();

// ADD: Apply admin authentication middleware to all routes
router.use(authenticateClerk, attachClerkUser, requireAdmin);

// Async handler to catch errors and forward to error middleware
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ✅ IMPROVED: Helper function to update product review statistics
const updateProductReviewStats = async (productId) => {
  try {
    // Validate product exists first
    const product = await Product.findById(productId);
    if (!product) {
      console.warn(`⚠️ Product ${productId} not found while updating review stats`);
      return null;
    }

    // Use centralized query logic
    const approvedReviews = await Review.find(getApprovedReviewsQuery(productId));
    
    // Use centralized statistics calculation
    const stats = calculateReviewStats(approvedReviews);

    // Update product with fresh statistics and embedded reviews
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
      lastReviewUpdate: new Date(),
      // Update embedded reviews array
      reviews: approvedReviews.map(review => ({
        _id: review._id,
        userId: review.userId,
        userName: review.userName,
        userEmail: review.userEmail,
        rating: review.rating,
        comment: review.comment,
        approved: true,
        status: 'approved',
        createdAt: review.createdAt,
        approvedAt: review.approvedAt,
        mediaUrls: review.mediaUrls || []
      }))
    }, { runValidators: true });

    console.log(`✅ Product ${productId} stats updated: ${stats.averageRating} avg rating, ${stats.totalReviews} reviews`);

    return stats;
  } catch (error) {
    console.error('❌ Error updating product review stats:', error);
    throw error;
  }
};

// ✅ GET /api/admin/reviews - Paginated review listing
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // REMOVED: Manual auth check since middleware handles it
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // FIXED: Support querying by both status and approved fields
    let statusFilter = {};
    if (req.query.status) {
      if (req.query.status === 'approved') {
        statusFilter = {
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
      } else if (req.query.status === 'pending') {
        statusFilter = {
          $or: [
            { status: 'pending' },
            { 
              $and: [
                { status: { $exists: false } },
                { approved: { $ne: true } }
              ]
            }
          ]
        };
      } else {
        statusFilter = { status: req.query.status };
      }
    }

    const [reviews, totalReviews, pendingReviews] = await Promise.all([
      Review.find(statusFilter)
        .populate('productId', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(),
      Review.countDocuments({ 
        $or: [
          { status: 'pending' },
          { 
            $and: [
              { status: { $exists: false } },
              { approved: { $ne: true } }
            ]
          }
        ]
      }),
    ]);

    const avgResult = await Review.aggregate([
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]);

    const averageRating = avgResult.length > 0 ? parseFloat(avgResult[0].averageRating.toFixed(1)) : 0;

    // FIXED: Better status counting that handles both fields
    const statusCounts = await Review.aggregate([
      {
        $project: {
          effectiveStatus: {
            $cond: {
              if: { $eq: ['$status', 'approved'] },
              then: 'approved',
              else: {
                $cond: {
                  if: { $eq: ['$approved', true] },
                  then: 'approved',
                  else: '$status'
                }
              }
            }
          }
        }
      },
      { $group: { _id: '$effectiveStatus', count: { $sum: 1 } } }
    ]);

    const statusCountMap = statusCounts.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    res.json({
      totalReviews,
      averageRating,
      pendingReviews,
      statusCounts: {
        pending: statusCountMap.pending || 0,
        approved: statusCountMap.approved || 0,
        rejected: statusCountMap.rejected || 0,
      },
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1,
      },
    });
  })
);

// ✅ GET /api/admin/reviews/:reviewId - Single review
router.get(
  '/:reviewId',
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ error: 'Invalid review ID format' });

    const review = await Review.findById(reviewId).populate('productId', 'name images');
    if (!review) return res.status(404).json({ error: 'Review not found' });

    res.json({ review });
  })
);

// ✅ PUT /api/admin/reviews/:reviewId/approve
router.put(
  '/:reviewId/approve',
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { adminResponse } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ error: 'Invalid review ID format' });

    const updateData = { 
      status: 'approved', 
      approved: true, // Update both fields for compatibility
      approvedAt: new Date() 
    };
    if (adminResponse?.trim()) updateData.adminResponse = adminResponse.trim();

    const review = await Review.findByIdAndUpdate(reviewId, updateData, {
      new: true,
      runValidators: true,
    }).populate('productId', 'name images');

    if (!review) return res.status(404).json({ error: 'Review not found' });

    // FIXED: Check if product exists before updating stats
    const product = await Product.findById(review.productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        productId: review.productId 
      });
    }

    const stats = await updateProductReviewStats(review.productId);
    console.log(`✅ Review ${reviewId} approved by admin ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Review approved successfully',
      review,
      updatedStats: stats,
    });
  })
);

// ✅ PUT /api/admin/reviews/:reviewId/reject
router.put(
  '/:reviewId/reject',
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { adminResponse } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ error: 'Invalid review ID format' });

    const updateData = { 
      status: 'rejected',
      approved: false // Update both fields for compatibility
    };
    if (adminResponse?.trim()) updateData.adminResponse = adminResponse.trim();

    const review = await Review.findByIdAndUpdate(reviewId, updateData, {
      new: true,
      runValidators: true,
    }).populate('productId', 'name images');

    if (!review) return res.status(404).json({ error: 'Review not found' });

    // FIXED: Check if product exists before updating stats
    const product = await Product.findById(review.productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        productId: review.productId 
      });
    }

    const stats = await updateProductReviewStats(review.productId);
    console.log(`⚠️ Review ${reviewId} rejected by admin ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Review rejected successfully',
      review,
      updatedStats: stats,
    });
  })
);

// ✅ DELETE /api/admin/reviews/:reviewId
router.delete(
  '/:reviewId',
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ error: 'Invalid review ID format' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const productId = review.productId;
    
    // FIXED: Check if product exists before deletion
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        productId 
      });
    }

    await Review.findByIdAndDelete(reviewId);

    const stats = await updateProductReviewStats(productId);
    console.log(`🗑️ Review ${reviewId} deleted by admin ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Review deleted successfully',
      deletedReview: {
        _id: review._id,
        userName: review.userName,
        productId: review.productId,
      },
      updatedStats: stats,
    });
  })
);

// ✅ GET /api/admin/reviews/stats
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    // FIXED: Better aggregation that handles both status fields
    const [stats] = await Review.aggregate([
      {
        $project: {
          rating: 1,
          effectiveStatus: {
            $cond: {
              if: { $eq: ['$status', 'approved'] },
              then: 'approved',
              else: {
                $cond: {
                  if: { $eq: ['$approved', true] },
                  then: 'approved',
                  else: {
                    $cond: {
                      if: { $eq: ['$status', 'rejected'] },
                      then: 'rejected',
                      else: {
                        $cond: {
                          if: { $eq: ['$status', 'pending'] },
                          then: 'pending',
                          else: 'pending' // default for legacy reviews
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
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
          statusCounts: [
            { $group: { _id: '$effectiveStatus', count: { $sum: 1 } } },
          ],
          ratingDistribution: [
            { $group: { _id: '$rating', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const summary = stats.summary[0] || { totalReviews: 0, averageRating: 0 };
    const statusMap = stats.statusCounts.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});
    const ratingDist = stats.ratingDistribution.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    console.log('📊 Admin review stats fetched successfully');

    res.json({
      totalReviews: summary.totalReviews,
      averageRating: parseFloat(summary.averageRating?.toFixed(1)) || 0,
      ratingDistribution: ratingDist,
      statusCounts: {
        pending: statusMap.pending || 0,
        approved: statusMap.approved || 0,
        rejected: statusMap.rejected || 0,
      },
    });
  })
);

// NEW: Endpoint to refresh product review cache
router.post('/products/:productId/refresh-cache', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  // FIXED: Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ 
      error: 'Product not found',
      productId 
    });
  }

  const stats = await updateProductReviewStats(productId);
  
  res.json({
    success: true,
    message: 'Product review cache refreshed successfully',
    productId,
    updatedStats: stats
  });
}));

// Centralized error handler
router.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err);
  if (res.headersSent) return next(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate review found' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default router;