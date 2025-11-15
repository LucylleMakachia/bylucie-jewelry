import { getAuth } from '@clerk/express';
import express from 'express';
import mongoose from 'mongoose';
import Wishlist from '../../models/Wishlist.js';
import Product from '../../models/Product.js';

// Import authentication middleware
import { authenticateClerk, attachClerkUser, requireAdmin } from '../../middleware/clerkAuth.js';

const router = express.Router();

// Apply admin authentication middleware to all routes
router.use(authenticateClerk, attachClerkUser, requireAdmin);

// Get wishlist data for admin
router.get('/', async (req, res) => {
  try {
    console.log('🔄 Fetching admin wishlist data...');
    
    // Get total wishlist items count
    const totalItems = await Wishlist.countDocuments();
    console.log(`📊 Total wishlist items: ${totalItems}`);

    // Get unique users count
    const uniqueUsers = await Wishlist.distinct('userId');
    const totalUsers = uniqueUsers.length;
    console.log(`👥 Unique users with wishlists: ${totalUsers}`);

    // Get popular items (most wishlisted products)
    const popularItems = await Wishlist.aggregate([
      {
        $group: {
          _id: '$productId',
          wishlistCount: { $sum: 1 }
        }
      },
      {
        $sort: { wishlistCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true // Handle products that might be deleted
        }
      },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productPrice: '$product.price',
          productImage: { $arrayElemAt: ['$product.images.url', 0] },
          wishlistCount: 1,
          _id: 0
        }
      }
    ]);

    console.log(`⭐ Popular items found: ${popularItems.length}`);

    // Get recent wishlist items with user info - FIXED: Better error handling
    const recentItems = await Wishlist.find()
      .populate({
        path: 'productId',
        select: 'name price images category',
        // FIXED: Add null handling for deleted products
        options: { allowNull: true }
      })
      .sort({ addedAt: -1 })
      .limit(50)
      .lean();

    console.log(`🕒 Recent items found: ${recentItems.length}`);

    // Item mapping with error handling - FIXED: Better null checks
    const items = recentItems.map(item => {
      // Handle cases where product might be deleted or null
      if (!item.productId || item.productId._id === null) {
        return {
          userId: item.userId,
          userName: item.userName || 'Anonymous User',
          productId: item.productId, // Keep original productId even if null
          productName: 'Product Not Available',
          productPrice: 0,
          productImage: '/images/placeholder.jpg',
          productCategory: 'Unavailable',
          addedAt: item.addedAt,
          status: 'deleted'
        };
      }

      // Handle both string and object image formats
      let productImage = '/images/placeholder.jpg';
      if (item.productId.images && item.productId.images.length > 0) {
        const firstImage = item.productId.images[0];
        productImage = typeof firstImage === 'string' ? firstImage : firstImage.url;
      }

      return {
        userId: item.userId,
        userName: item.userName || 'Anonymous User',
        productId: item.productId._id,
        productName: item.productId.name || 'Unknown Product', // FIXED: Added fallback
        productPrice: item.productId.price || 0, // FIXED: Added fallback
        productImage: productImage,
        productCategory: item.productId.category || 'Uncategorized',
        addedAt: item.addedAt,
        status: 'active'
      };
    });

    // Calculate additional statistics
    const wishlistStats = {
      mostWishlisted: popularItems.slice(0, 5),
      recentAdditions: items.slice(0, 10),
      averageItemsPerUser: totalUsers > 0 ? (totalItems / totalUsers).toFixed(1) : 0,
      growthRate: 0,
      topCategories: await getTopWishlistCategories()
    };

    // Return data in the exact format expected by frontend
    const responseData = {
      totalItems,
      totalUsers, // Frontend maps this to uniqueUsers
      popularItems: popularItems.map(item => ({
        ...item,
        productName: item.productName || 'Unknown Product',
        productPrice: item.productPrice || 0,
        productImage: item.productImage || '/images/placeholder.jpg',
        // FIXED: Ensure wishlistCount is always a number
        wishlistCount: item.wishlistCount || 0
      })),
      items, // This matches the frontend expectation
      // Include additional data for potential future use
      userWishlists: await getUserWishlistSummary(),
      wishlistStats
    };

    console.log('✅ Wishlist data prepared successfully');
    console.log('📦 Response structure:', {
      totalItems: responseData.totalItems,
      totalUsers: responseData.totalUsers,
      popularItemsCount: responseData.popularItems.length,
      itemsCount: responseData.items.length
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ Error fetching wishlist data:', error);
    
    // Return proper error response with consistent structure
    res.status(500).json({ 
      error: 'Failed to fetch wishlist data',
      message: error.message,
      // Provide fallback data structure that matches frontend expectations
      totalItems: 0,
      totalUsers: 0,
      popularItems: [],
      items: []
    });
  }
});

// Helper function to get top wishlist categories
async function getTopWishlistCategories() {
  try {
    const categoryStats = await Wishlist.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true // FIXED: Handle deleted products
        }
      },
      {
        $match: {
          'product': { $ne: null } // FIXED: Only count products that exist
        }
      },
      {
        $group: {
          _id: '$product.category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    return categoryStats;
  } catch (error) {
    console.error('Error getting top categories:', error);
    return [];
  }
}

// Helper function to get user wishlist summary
async function getUserWishlistSummary() {
  try {
    const userSummary = await Wishlist.aggregate([
      {
        $group: {
          _id: '$userId',
          itemCount: { $sum: 1 },
          lastAdded: { $max: '$addedAt' },
          userName: { $first: '$userName' }
        }
      },
      {
        $sort: { itemCount: -1 }
      },
      {
        $limit: 20
      },
      {
        $project: {
          userId: '$_id',
          itemCount: 1,
          lastAdded: 1,
          userName: 1,
          _id: 0
        }
      }
    ]);

    return userSummary;
  } catch (error) {
    console.error('Error getting user summary:', error);
    return [];
  }
}

// Endpoint to get wishlist details for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userWishlist = await Wishlist.find({ userId })
      .populate({
        path: 'productId',
        select: 'name price images category description',
        options: { allowNull: true } // FIXED: Handle deleted products
      })
      .sort({ addedAt: -1 });

    const items = userWishlist.map(item => {
      if (!item.productId || item.productId._id === null) {
        return {
          productId: item.productId,
          productName: 'Product Not Available',
          productPrice: 0,
          productImage: '/images/placeholder.jpg',
          addedAt: item.addedAt,
          status: 'deleted'
        };
      }

      let productImage = '/images/placeholder.jpg';
      if (item.productId.images && item.productId.images.length > 0) {
        const firstImage = item.productId.images[0];
        productImage = typeof firstImage === 'string' ? firstImage : firstImage.url;
      }

      return {
        productId: item.productId._id,
        productName: item.productId.name || 'Unknown Product', // FIXED: Added fallback
        productPrice: item.productId.price || 0, // FIXED: Added fallback
        productImage: productImage,
        productCategory: item.productId.category || 'Uncategorized',
        productDescription: item.productId.description,
        addedAt: item.addedAt, // FIXED: Corrected field name from addAt to addedAt
        status: 'active'
      };
    });

    res.json({
      userId,
      userName: userWishlist[0]?.userName || 'Anonymous User',
      totalItems: items.length,
      items
    });

  } catch (error) {
    console.error('Error fetching user wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch user wishlist' });
  }
});

// Endpoint to get wishlist statistics
router.get('/stats', async (req, res) => {
  try {
    const totalItems = await Wishlist.countDocuments();
    const totalUsers = (await Wishlist.distinct('userId')).length;
    
    // Get daily additions for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Wishlist.aggregate([
      {
        $match: {
          addedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$addedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalItems,
      totalUsers,
      averageItemsPerUser: totalUsers > 0 ? (totalItems / totalUsers).toFixed(1) : 0,
      dailyStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching wishlist stats:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist statistics' });
  }
});

export default router;