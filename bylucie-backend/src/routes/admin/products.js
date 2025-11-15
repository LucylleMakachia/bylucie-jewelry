import express from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { authenticateClerk, attachClerkUser, requireAdmin } from '../../middleware/clerkAuth.js';
import Product from '../../models/Product.js';
import Review from '../../models/Review.js'; // ADD: Import Review model
import { getApprovedReviewsQuery, calculateReviewStats } from '../../utils/reviewHelpers.js'; // ADD: Import review helpers

const router = express.Router();

const USE_DATABASE = true;
const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

function logError(context, err) {
  console.error(`[Admin Products Router] ${context}:`, err.message || err);
}

function logAdminAction(req, action, details = {}) {
  console.log(`🛠️ Admin Action: ${req.user?.id} ${action}`, {
    method: req.method,
    path: req.path,
    ...details
  });
}

function ensureDataFile() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fsSync.existsSync(dataDir)) {
      fsSync.mkdirSync(dataDir, { recursive: true });
    }
    if (!fsSync.existsSync(dataFilePath)) {
      fsSync.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
    }
  } catch (err) {
    logError('ensureDataFile failed', err);
    throw new Error(`Failed to ensure data file: ${err.message}`);
  }
}

async function readProducts() {
  try {
    ensureDataFile();
    const data = await fs.readFile(dataFilePath, 'utf-8');
    if (!data.trim()) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    logError('readProducts failed', err);
    return [];
  }
}

async function writeProducts(products) {
  try {
    ensureDataFile();
    await fs.writeFile(dataFilePath, JSON.stringify(products, null, 2));
  } catch (err) {
    logError('writeProducts failed', err);
    throw new Error('Failed to save products');
  }
}

// IMPROVED: Helper function to update product review statistics
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

    // Update the product with new statistics
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
      lastReviewUpdate: new Date()
    }, { runValidators: true });

    console.log(`✅ Updated product ${productId} review stats: ${stats.averageRating} avg, ${stats.totalReviews} reviews`);
    
    return stats;
  } catch (error) {
    console.error('❌ Error updating product review stats:', error);
    throw error;
  }
};

// Helper function to transform images to match schema
function transformImages(imagesInput) {
  if (!imagesInput) return [];
  
  console.log('🔄 Input for image transformation:', {
    type: typeof imagesInput,
    isArray: Array.isArray(imagesInput),
    value: imagesInput
  });
  
  // If it's a single base64 string
  if (typeof imagesInput === 'string') {
    console.log('📝 Transforming base64 string to image object');
    return [{ 
      url: imagesInput,
      public_id: null 
    }];
  }
  
  // If it's already an array, ensure each item has the correct structure
  if (Array.isArray(imagesInput)) {
    console.log('📝 Processing images array with', imagesInput.length, 'items');
    return imagesInput.map(img => {
      // If it's already in the correct format, return as-is
      if (img && typeof img === 'object' && img.url) {
        return img;
      }
      // If it's a string in the array, convert to object
      if (typeof img === 'string') {
        return { url: img, public_id: null };
      }
      // If it's an invalid object, return minimal valid object
      return { url: '', public_id: null };
    }).filter(img => img.url !== '');
  }
  
  console.log('❌ Invalid images input, returning empty array');
  return [];
}

// Apply middleware chain: authenticateClerk -> attachClerkUser -> requireAdmin
router.use(authenticateClerk, attachClerkUser, requireAdmin);

// GET - Fetch all products (Admin only)
router.get('/', async (req, res, next) => {
  try {
    logAdminAction(req, 'fetching all products');
    
    if (USE_DATABASE) {
      // FIXED: Include review statistics in product data
      const products = await Product.find({}).sort({ createdAt: -1 });
      
      // NEW: Get fresh review counts for each product using centralized logic
      const productsWithReviewStats = await Promise.all(
        products.map(async (product) => {
          const approvedReviews = await Review.find(getApprovedReviewsQuery(product._id));
          
          const productObj = product.toObject();
          productObj.reviewCount = approvedReviews.length;
          productObj.rating = approvedReviews.length > 0 
            ? parseFloat((approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length).toFixed(1))
            : 0;
          
          return productObj;
        })
      );
      
      console.log(`📦 Admin found ${products.length} products with fresh review stats`);
      
      return res.json({ 
        products: productsWithReviewStats,
        admin: true,
        count: products.length,
        timestamp: new Date().toISOString()
      });
    }
    
    const products = await readProducts();
    return res.json({ 
      products,
      admin: true,
      count: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logError('GET / failed', err);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: err.message 
    });
  }
});

// POST - Create new product (Admin only) - UPDATED
router.post('/', async (req, res, next) => {
  try {
    console.log('🔄 Full request body received:', {
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      description: req.body.description,
      images: req.body.images ? `Present (type: ${typeof req.body.images}, isArray: ${Array.isArray(req.body.images)})` : 'No images'
    });

    if (USE_DATABASE) {
      // Transform images to match schema format
      const images = transformImages(req.body.images);
      console.log('🖼️ Transformed images for schema:', images);

      // FIXED: Initialize review statistics for new products
      const productData = {
        name: req.body.name,
        price: Number(req.body.price),
        description: req.body.description || '',
        category: req.body.category,
        stock: Number(req.body.stock) || 0,
        status: req.body.status || 'active',
        materials: Array.isArray(req.body.materials) ? req.body.materials : [],
        discountPercentage: Number(req.body.discountPercentage) || 0,
        images: images,
        createdBy: req.user.id,
        // NEW: Initialize review statistics
        rating: 0,
        reviewCount: 0,
        reviews: [] // Initialize empty reviews array
      };

      console.log('📦 Final product data for DB:', {
        ...productData,
        images: `Array with ${productData.images.length} images`
      });

      // Create and validate product
      const newProduct = new Product(productData);
      
      // Manual validation
      const validationError = newProduct.validateSync();
      if (validationError) {
        console.error('❌ Product validation failed:', validationError);
        throw validationError;
      }
      
      console.log('✅ Product validation passed, saving...');
      
      const savedProduct = await newProduct.save();
      console.log('✅ Product saved to database with ID:', savedProduct._id);
      
      return res.status(201).json({
        message: 'Product created successfully',
        product: savedProduct,
        admin: true
      });
    }

    const products = await readProducts();
    
    const newProduct = {
      _id: Date.now().toString(),
      ...req.body,
      status: req.body.status || 'active',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    products.push(newProduct);
    await writeProducts(products);

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
      admin: true
    });
  } catch (err) {
    console.error('❌ FULL ERROR creating product:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    
    if (err.errors) {
      console.error('Validation errors:');
      Object.keys(err.errors).forEach(key => {
        console.error(`  ${key}:`, err.errors[key]);
      });
    }
    
    logError('POST / failed', err);
    res.status(500).json({ 
      error: 'Failed to create product',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? (err.errors || err.message) : undefined
    });
  }
});

// PUT - Update existing product (Admin only) - UPDATED
router.put('/:id', async (req, res, next) => {
  try {
    logAdminAction(req, 'updating product', { 
      productId: req.params.id,
      updates: req.body 
    });
    
    if (USE_DATABASE) {
      // Prepare update data
      const updateData = { 
        ...req.body,
        updatedAt: new Date()
      };

      // Transform images if provided in update
      if (req.body.images !== undefined) {
        updateData.images = transformImages(req.body.images);
      }
      
      // Update product directly in database
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedProduct) {
        return res.status(404).json({ 
          error: 'Product not found',
          id: req.params.id 
        });
      }

      // NEW: Refresh review statistics after product update
      await updateProductReviewStats(req.params.id);
      
      return res.json({
        message: 'Product updated successfully',
        product: updatedProduct,
        admin: true
      });
    }

    const products = await readProducts();
    
    const index = products.findIndex((p) => 
      p.id === req.params.id || p._id === req.params.id
    );
    
    if (index === -1) {
      return res.status(404).json({ 
        error: 'Product not found',
        id: req.params.id 
      });
    }

    products[index] = {
      ...products[index],
      ...req.body,
      [products[index]._id ? '_id' : 'id']: req.params.id,
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString(),
    };
    
    await writeProducts(products);

    res.json({
      message: 'Product updated successfully',
      product: products[index],
      admin: true
    });
  } catch (err) {
    logError('PUT /:id failed', err);
    res.status(500).json({ 
      error: 'Failed to update product',
      message: err.message 
    });
  }
});

// DELETE - Remove product (Admin only) - UPDATED
router.delete('/:id', async (req, res, next) => {
  try {
    logAdminAction(req, 'deleting product', { 
      productId: req.params.id 
    });
    
    if (USE_DATABASE) {
      // NEW: Delete associated reviews first
      await Review.deleteMany({ productId: req.params.id });
      console.log(`🗑️ Deleted reviews for product ${req.params.id}`);
      
      // Delete product directly from database
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);
      
      if (!deletedProduct) {
        return res.status(404).json({ 
          error: 'Product not found',
          id: req.params.id 
        });
      }
      
      return res.json({ 
        message: 'Product and associated reviews deleted successfully',
        product: deletedProduct,
        admin: true 
      });
    }

    const products = await readProducts();
    
    const filteredProducts = products.filter((p) => 
      p.id !== req.params.id && p._id !== req.params.id
    );

    if (filteredProducts.length === products.length) {
      return res.status(404).json({ 
        error: 'Product not found',
        id: req.params.id 
      });
    }

    await writeProducts(filteredProducts);
    
    res.json({ 
      message: 'Product deleted successfully',
      admin: true 
    });
  } catch (err) {
    logError('DELETE /:id failed', err);
    res.status(500).json({ 
      error: 'Failed to delete product',
      message: err.message 
    });
  }
});

// NEW: Endpoint to refresh product review statistics
router.post('/:id/refresh-reviews', async (req, res) => {
  try {
    const productId = req.params.id;
    logAdminAction(req, 'refreshing product review stats', { productId });
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        id: productId 
      });
    }

    const stats = await updateProductReviewStats(productId);
    
    res.json({
      success: true,
      message: 'Product review statistics refreshed successfully',
      productId,
      updatedStats: stats,
      admin: true
    });
    
  } catch (err) {
    logError('POST /:id/refresh-reviews failed', err);
    res.status(500).json({ 
      error: 'Failed to refresh product review statistics',
      message: err.message 
    });
  }
});

export default router;