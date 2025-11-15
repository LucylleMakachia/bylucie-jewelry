import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  // Make userId optional for guest reviews
  userId: {
    type: String,
    required: false, // Optional for guests
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
  },
  userEmail: {
    type: String,
    required: [true, 'User email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function (email) {
        // Basic email format check
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: props => `${props.value} is not a valid email address`,
    },
  },
  userImage: {
    type: String,
    default: '', // Optional user image URL
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5'],
  },
  comment: {
    type: String,
    required: false, // Optional comment
    trim: true,
  },
  // NEW: Media attachments for reviews (images/videos)
  mediaUrls: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    caption: {
      type: String,
      default: ''
    }
  }],
  // Status field for new system
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  // NEW: Legacy approved field for backward compatibility
  approved: {
    type: Boolean,
    default: false
  },
  // NEW: Track when review was approved
  approvedAt: {
    type: Date,
    default: null
  },
  helpfulVotes: {
    type: Number,
    default: 0,
  },
  adminResponse: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
  // strict mode enabled by default to avoid unexpected fields
});

// Index for approved field for efficient queries
reviewSchema.index({ approved: 1 });
reviewSchema.index({ productId: 1, approved: 1 });
reviewSchema.index({ productId: 1, status: 1 });
// NEW: Compound index for efficient approved reviews query
reviewSchema.index({ productId: 1, status: 1, approved: 1 });
// NEW: Index for sorting by creation date
reviewSchema.index({ createdAt: -1 });

// NEW: Virtual for isApproved (combines both status and approved fields)
reviewSchema.virtual('isApproved').get(function() {
  return this.status === 'approved' || this.approved === true;
});

// NEW: Pre-save middleware to sync status and approved fields
reviewSchema.pre('save', function(next) {
  // Sync approved field with status
  if (this.status === 'approved') {
    this.approved = true;
    // Set approvedAt timestamp if not already set
    if (!this.approvedAt) {
      this.approvedAt = new Date();
    }
  } else if (this.status === 'rejected' || this.status === 'pending') {
    this.approved = false;
    // Clear approvedAt if not approved
    if (this.approvedAt) {
      this.approvedAt = null;
    }
  }
  
  // Also sync status if approved field is manually set
  if (this.approved === true && this.status !== 'approved') {
    this.status = 'approved';
    if (!this.approvedAt) {
      this.approvedAt = new Date();
    }
  } else if (this.approved === false && this.status === 'approved') {
    this.status = 'pending';
    if (this.approvedAt) {
      this.approvedAt = null;
    }
  }
  
  next();
});

// NEW: Static method to find approved reviews (handles both fields)
reviewSchema.statics.findApproved = function(query = {}) {
  return this.find({
    ...query,
    $or: [
      { status: 'approved' },
      { approved: true }
    ]
  });
};

// NEW: Static method to find pending reviews
reviewSchema.statics.findPending = function(query = {}) {
  return this.find({
    ...query,
    $or: [
      { status: 'pending' },
      { 
        $and: [
          { status: { $exists: false } },
          { approved: { $ne: true } }
        ]
      }
    ]
  });
};

// NEW: Instance method to approve review
reviewSchema.methods.approve = function() {
  this.status = 'approved';
  this.approved = true;
  this.approvedAt = new Date();
  return this.save();
};

// NEW: Instance method to reject review
reviewSchema.methods.reject = function() {
  this.status = 'rejected';
  this.approved = false;
  this.approvedAt = null;
  return this.save();
};

// NEW: Instance method to check if review is visible (approved)
reviewSchema.methods.isVisible = function() {
  return this.status === 'approved' || this.approved === true;
};

// Ensure virtual fields are serialized when converted to JSON
reviewSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove internal fields from JSON output
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Review', reviewSchema);