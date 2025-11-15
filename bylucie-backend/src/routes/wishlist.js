import express from 'express';
import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { authenticateClerk } from '../middleware/clerkAuth.js';

const router = express.Router();

// Apply authentication to all wishlist routes
router.use(authenticateClerk);

// Get user's wishlist
router.get('/', async (req, res) => {
  try {
    const { userId } = req.auth;
    
    console.log('Fetching wishlist for user:', userId); // Debug log
    
    const wishlistItems = await Wishlist.find({ userId })
      .populate('productId', 'name price images category rating reviewCount')
      .sort({ addedAt: -1 });

    // Create detailed items array with product information
    const detailedItems = wishlistItems.map(item => ({
      _id: item._id,
      productId: item.productId?._id?.toString(),
      name: item.productId?.name || 'Unknown Product',
      price: item.productId?.price || 0,
      image: item.productId?.images?.[0]?.url || item.productId?.images?.[0] || '/images/placeholder.jpg',
      category: item.productId?.category || 'Uncategorized',
      rating: item.productId?.rating || 0,
      reviewCount: item.productId?.reviewCount || 0,
      addedAt: item.addedAt
    }));

    // Extract just the product IDs for quick checking
    const productIds = detailedItems.map(item => item.productId).filter(Boolean);

    console.log('Wishlist items found:', productIds.length); // Debug log
    
    res.json({ 
      success: true,
      items: productIds, // Array of product IDs for frontend checking
      detailedItems: detailedItems // Array of full product details for display
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch wishlist' 
    });
  }
});

// Add item to wishlist
router.post('/', async (req, res) => {
  try {
    const { userId } = req.auth;
    const { productId } = req.body;

    console.log('Adding to wishlist - User:', userId, 'Product:', productId); // Debug log

    if (!productId) {
      return res.status(400).json({ 
        success: false,
        error: 'Product ID is required' 
      });
    }

    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid product ID format' 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({ userId, productId });
    if (existingItem) {
      return res.status(409).json({ 
        success: false,
        error: 'Product already in wishlist' 
      });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({
      userId,
      userName: req.auth?.firstName || 'User',
      productId
    });

    await wishlistItem.save();

    console.log('Product added to wishlist successfully'); // Debug log

    // Return updated wishlist
    const wishlistItems = await Wishlist.find({ userId })
      .populate('productId', 'name price images category rating reviewCount')
      .sort({ addedAt: -1 });

    const detailedItems = wishlistItems.map(item => ({
      _id: item._id,
      productId: item.productId?._id?.toString(),
      name: item.productId?.name || 'Unknown Product',
      price: item.productId?.price || 0,
      image: item.productId?.images?.[0]?.url || item.productId?.images?.[0] || '/images/placeholder.jpg',
      category: item.productId?.category || 'Uncategorized',
      rating: item.productId?.rating || 0,
      reviewCount: item.productId?.reviewCount || 0,
      addedAt: item.addedAt
    }));

    const productIds = detailedItems.map(item => item.productId).filter(Boolean);

    res.status(201).json({ 
      success: true,
      message: 'Product added to wishlist',
      items: productIds,
      detailedItems: detailedItems
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add to wishlist' 
    });
  }
});

// Remove item from wishlist
router.delete('/:productId', async (req, res) => {
  try {
    const { userId } = req.auth;
    const { productId } = req.params;

    console.log('Removing from wishlist - User:', userId, 'Product:', productId); // Debug log

    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid product ID format' 
      });
    }

    const result = await Wishlist.findOneAndDelete({ userId, productId });

    if (!result) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found in wishlist' 
      });
    }

    console.log('Product removed from wishlist successfully'); // Debug log

    res.json({ 
      success: true,
      message: 'Product removed from wishlist' 
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to remove from wishlist' 
    });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', async (req, res) => {
  try {
    const { userId } = req.auth;
    const { productId } = req.params;

    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid product ID format' 
      });
    }

    const wishlistItem = await Wishlist.findOne({ userId, productId });
    
    res.json({
      success: true,
      inWishlist: !!wishlistItem
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check wishlist' 
    });
  }
});

export default router;