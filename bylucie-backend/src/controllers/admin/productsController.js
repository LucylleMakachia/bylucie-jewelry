import mongoose from 'mongoose';
import Product from '../../models/Product.js';

// --- Input Validation Helper ---
function validateProductInput(data) {
  if (!data.name || typeof data.name !== 'string') {
    return 'Product name is required and must be a string';
  }

  if (data.price === undefined || typeof data.price !== 'number' || data.price < 0) {
    return 'Product price is required, must be a non-negative number';
  }

  if (data.status && !['active', 'inactive'].includes(data.status)) {
    return 'Product status must be active or inactive';
  }

  return null; // No errors
}

// --- Normalization Helper ---
function normalizeProduct(product) {
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
  try {
    // Map frontend stock field to backend inventoryCount
    if (req.body.stock !== undefined) {
      req.body.inventoryCount = req.body.stock;
      delete req.body.stock;
    }

    const validationError = validateProductInput(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json(normalizeProduct(product));
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }
    next(error);
  }
}

// --- GET ALL PRODUCTS ---
export async function getProducts(req, res, next) {
  try {
    const products = await Product.find();
    const normalized = products.map(normalizeProduct);
    res.json({ products: normalized });
  } catch (error) {
    next(error);
  }
}

// --- GET PRODUCT BY ID ---
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(normalizeProduct(product));
  } catch (error) {
    next(error);
  }
}

// --- UPDATE PRODUCT ---
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Map frontend stock field to backend inventoryCount
    if (req.body.stock !== undefined) {
      req.body.inventoryCount = req.body.stock;
      delete req.body.stock;
    }

    const validationError = validateProductInput(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(normalizeProduct(product));
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }
    next(error);
  }
}

// --- DELETE PRODUCT ---
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}
