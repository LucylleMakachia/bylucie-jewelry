import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: { type: String, required: [true, 'Image URL is required'] },
  public_id: { type: String }, // optional, for Cloudinary deletion
});

// Main product schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true, // Index for faster category-based queries
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number',
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Description too long'],
    },
    materials: [
      {
        type: String,
        trim: true,
        minlength: [2, 'Material name too short'],
      },
    ],
    images: [imageSchema],
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true, // index for efficient filtering
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // NEW: Review statistics fields
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative']
    },
    // NEW: Embedded reviews array for quick access
    reviews: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
      },
      userId: String,
      userName: String,
      userEmail: String,
      rating: Number,
      comment: String,
      approved: Boolean,
      status: String,
      createdAt: Date,
      approvedAt: Date,
      mediaUrls: [{
        url: String,
        type: {
          type: String,
          enum: ['image', 'video'],
          default: 'image'
        },
        caption: String
      }]
    }],
    // NEW: Track when reviews were last updated
    lastReviewUpdate: {
      type: Date,
      default: null
    },
    // NEW: Additional fields for compatibility
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    brand: {
      type: String,
      trim: true
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    // NEW: Admin tracking
    createdBy: {
      type: String, // Clerk user ID
      default: 'system'
    },
    updatedBy: {
      type: String, // Clerk user ID
      default: null
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    validateBeforeSave: true,
    toJSON: { virtuals: true, getters: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true, getters: true }, // Include virtuals when converting to Object
  }
);

// Compound text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

// NEW: Index for review statistics
productSchema.index({ rating: -1 });
productSchema.index({ reviewCount: -1 });

// Virtual field for discounted price
productSchema.virtual('discountedPrice').get(function () {
  if (this.discountPercentage > 0) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
});

// Virtual field for stockQuantity (compatibility with frontend)
productSchema.virtual('stockQuantity').get(function () {
  return this.stock;
});

// NEW: Virtual for in-stock status
productSchema.virtual('inStock').get(function () {
  return this.stock > 0 && this.status === 'active';
});

// NEW: Virtual for inventory count (compatibility)
productSchema.virtual('inventoryCount').get(function () {
  return this.stock;
});

// Instance method to check availability
productSchema.methods.isAvailable = function () {
  return this.status === 'active' && this.stock > 0;
};

// Instance method to check if low stock
productSchema.methods.isLowStock = function () {
  return this.stock < 10;
};

// NEW: Instance method to update review statistics
productSchema.methods.updateReviewStats = async function() {
  const Review = mongoose.model('Review');
  
  // Get approved reviews using centralized query logic
  const approvedReviews = await Review.find({
    productId: this._id,
    $or: [
      { status: 'approved' },
      { 
        $and: [
          { status: { $exists: false } },
          { approved: true }
        ]
      }
    ]
  });
  
  const reviewCount = approvedReviews.length;
  const averageRating = reviewCount > 0 
    ? parseFloat((approvedReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount).toFixed(1))
    : 0;

  // Update the product with new statistics
  this.rating = averageRating;
  this.reviewCount = reviewCount;
  this.lastReviewUpdate = new Date();
  
  // Also update the embedded reviews array for quick access
  this.reviews = approvedReviews.map(review => ({
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
  }));
  
  return this.save();
};

// Static method to find active products
productSchema.statics.findActive = function () {
  return this.find({ status: 'active' });
};

// Pre-save middleware to ensure discountPercentage is valid
productSchema.pre('save', function (next) {
  if (this.discountPercentage < 0 || this.discountPercentage > 100) {
    return next(new Error('Discount percentage must be between 0 and 100'));
  }
  next();
});

// Customize toJSON to remove internal fields
productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Product', productSchema);