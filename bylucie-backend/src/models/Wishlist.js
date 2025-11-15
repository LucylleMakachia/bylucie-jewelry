import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can't add the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Index for querying by user
wishlistSchema.index({ userId: 1 });

// Index for querying by product
wishlistSchema.index({ productId: 1 });

// Index for sorting by date
wishlistSchema.index({ addedAt: -1 }); 
export default mongoose.model('Wishlist', wishlistSchema);