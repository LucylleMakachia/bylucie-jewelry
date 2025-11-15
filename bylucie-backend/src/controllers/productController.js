import mongoose from 'mongoose';
import Product from '../../models/Product.js';

console.log('🔄 Loading products controller...');
console.log('📦 Product model path:', new URL('../../models/Product.js', import.meta.url).pathname);

// --- Input Validation Helper ---
function validateProductInput(data) {
  console.log('🔍 Validating product input:', data);
  
  if (!data.name || typeof data.name !== 'string') {
    const error = 'Product name is required and must be a string';
    console.log('❌ Validation failed:', error);
    return error;
  }

  if (data.price === undefined || typeof data.price !== 'number' || data.price < 0) {
    const error = 'Product price is required, must be a non-negative number';
    console.log('❌ Validation failed:', error);
    return error;
  }

  if (data.status && !['active', 'inactive'].includes(data.status)) {
    const error = 'Product status must be active or inactive';
    console.log('❌ Validation failed:', error);
    return error;
  }

  console.log('✅ Input validation passed');
  return null; // No validation errors
}

// --- Normalization Helper ---
function normalizeProduct(product) {
  console.log('🔄 Normalizing product for response');
  return {
    id: product._id.toString(),
    name: product.name,
    price: product.price,
    stock: product.inventoryCount !== undefined ? product.inventoryCount : 0,
    status: product.status,
    category: product.category,
    description: product.description,
    images: product.images || [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// --- CREATE PRODUCT ---
export async function createProduct(req, res, next) {
  console.log('🎯 CREATE PRODUCT - Starting process');
  console.log('📤 Request body:', JSON.stringify(req.body, null, 2));
  console.log('👤 User making request:', req.user?.id);
  
  try {
    console.log('🔍 Starting input validation...');
    const validationError = validateProductInput(req.body);
    if (validationError) {
      console.log('❌ Validation error, returning 400');
      return res.status(400).json({ error: validationError });
    }

    console.log('📝 Creating new Product instance...');
    const product = new Product(req.body);
    console.log('✅ Product instance created:', {
      name: product.name,
      price: product.price,
      category: product.category
    });

    console.log('💾 Attempting to save product to database...');
    await product.save();
    console.log('✅ Product saved successfully! ID:', product._id);
    console.log('📦 Full saved product:', product.toObject());

    const normalized = normalizeProduct(product);
    console.log('📤 Sending success response with normalized product');
    
    res.status(201).json(normalized);
    
  } catch (error) {
    console.error('🔴 CRITICAL ERROR in createProduct:');
    console.error('🔴 Error name:', error.name);
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.log('❌ Mongoose validation error detected');
      const messages = Object.values(error.errors).map((e) => e.message);
      console.log('📋 Validation messages:', messages);
      return res.status(400).json({ errors: messages });
    }
    
    console.log('🚨 Passing error to next middleware');
    next(error);
  }
}

// --- GET ALL PRODUCTS ---
export async function getProducts(req, res, next) {
  console.log('🎯 GET ALL PRODUCTS - Starting process');
  
  try {
    console.log('🔍 Querying database for all products...');
    const products = await Product.find();
    console.log(`✅ Found ${products.length} products`);
    
    console.log('🔄 Normalizing products for response...');
    const normalized = products.map(normalizeProduct);
    
    res.json({ products: normalized });
    console.log('📤 Sent products response');
    
  } catch (error) {
    console.error('🔴 Error in getProducts:', error);
    next(error);
  }
}

// --- GET PRODUCT BY ID ---
export async function getProductById(req, res, next) {
  console.log('🎯 GET PRODUCT BY ID - Starting process');
  console.log('🔍 Product ID:', req.params.id);
  
  try {
    const { id } = req.params;

    console.log('🔍 Validating ObjectId...');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid product ID format');
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    console.log('🔍 Querying database for product...');
    const product = await Product.findById(id);
    
    if (!product) {
      console.log('❌ Product not found in database');
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product found:', product.name);
    res.json(normalizeProduct(product));
    
  } catch (error) {
    console.error('🔴 Error in getProductById:', error);
    next(error);
  }
}

// --- UPDATE PRODUCT ---
export async function updateProduct(req, res, next) {
  console.log('🎯 UPDATE PRODUCT - Starting process');
  console.log('🔍 Product ID:', req.params.id);
  console.log('📤 Update data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { id } = req.params;

    console.log('🔍 Validating ObjectId...');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid product ID format');
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    console.log('🔍 Validating input data...');
    const validationError = validateProductInput(req.body);
    if (validationError) {
      console.log('❌ Input validation failed');
      return res.status(400).json({ error: validationError });
    }

    console.log('🔍 Updating product in database...');
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      console.log('❌ Product not found for update');
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product updated successfully:', product.name);
    res.json(normalizeProduct(product));
    
  } catch (error) {
    console.error('🔴 Error in updateProduct:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }
    next(error);
  }
}

// --- DELETE PRODUCT ---
export async function deleteProduct(req, res, next) {
  console.log('🎯 DELETE PRODUCT - Starting process');
  console.log('🔍 Product ID:', req.params.id);
  
  try {
    const { id } = req.params;

    console.log('🔍 Validating ObjectId...');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid product ID format');
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    console.log('🔍 Deleting product from database...');
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      console.log('❌ Product not found for deletion');
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product deleted successfully:', product.name);
    res.json({ message: 'Product deleted successfully' });
    
  } catch (error) {
    console.error('🔴 Error in deleteProduct:', error);
    next(error);
  }
}

console.log('✅ Products controller loaded successfully');