import express from 'express';
import { safeAggregate } from '../../../utils/dbHelpers.js';

const router = express.Router();

// Get product analytics compatible with AnalyticsManager
router.get('/', async (req, res) => {
  try {
    const { limit = 5, timeRange = '6months' } = req.query;
    
    // Calculate date range based on timeRange parameter
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default: // 6months
        startDate.setMonth(startDate.getMonth() - 6);
    }

    let matchStage = {
      createdAt: { $gte: startDate, $lte: endDate },
      // Include all orders except cancelled for analytics
      status: { $ne: 'cancelled' }
    };

    const productPerformance = await safeAggregate('orders', [
      { $match: matchStage },
      { $unwind: { path: '$cartItems', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'cartItems.productId': { $exists: true },
          'cartItems.quantity': { $exists: true, $gt: 0 },
          'cartItems.price': { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$cartItems.productId',
          totalSold: { $sum: '$cartItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$cartItems.quantity', '$cartItems.price'] } },
          orderCount: { $sum: 1 },
          productName: { $first: '$cartItems.name' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          name: { 
            $ifNull: [
              '$productName', 
              '$product.name', 
              'Unknown Product'
            ] 
          },
          label: { 
            $ifNull: [
              '$productName', 
              '$product.name', 
              'Unknown Product'
            ] 
          },
          category: '$product.category',
          price: '$product.price',
          stock: '$product.stock',
          sales: '$totalSold',
          revenue: '$totalRevenue',
          value: '$totalSold',
          count: '$totalSold',
          orderCount: 1,
          image: {
            $cond: {
              if: { $and: [{ $isArray: '$product.images' }, { $gt: [{ $size: '$product.images' }, 0] }] },
              then: { 
                $let: {
                  vars: { firstImg: { $arrayElemAt: ['$product.images', 0] } },
                  in: {
                    $cond: {
                      if: { $eq: [{ $type: '$$firstImg' }, 'string'] },
                      then: '$$firstImg',
                      else: '$$firstImg.url'
                    }
                  }
                }
              },
              else: null,
            },
          },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Transform to AnalyticsManager expected format
    const formattedProducts = (productPerformance || []).map(product => ({
      name: product.name,
      label: product.label || product.name,
      sales: product.sales || 0,
      revenue: product.revenue || 0,
      value: product.value || product.sales || 0,
      count: product.count || product.sales || 0
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Product analytics error:', error.stack || error);
    // Return empty array in expected format
    res.status(500).json([]);
  }
});

// Additional endpoint for dashboard popular products
router.get('/popular', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const popularProducts = await safeAggregate('orders', [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: { path: '$cartItems', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'cartItems.productId': { $exists: true },
          'cartItems.quantity': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$cartItems.productId',
          name: { $first: '$cartItems.name' },
          sales: { $sum: '$cartItems.quantity' },
          revenue: {
            $sum: {
              $multiply: ['$cartItems.quantity', '$cartItems.price']
            }
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$name', '$product.name', 'Unknown Product'] },
          label: { $ifNull: ['$name', '$product.name', 'Unknown Product'] },
          sales: 1,
          revenue: 1,
          value: '$sales',
          count: '$sales'
        }
      },
      { $sort: { sales: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(popularProducts || []);
  } catch (error) {
    console.error('Popular products analytics error:', error);
    res.status(500).json([]);
  }
});

export default router;