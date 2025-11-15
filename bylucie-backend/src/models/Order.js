import mongoose from 'mongoose';

const guestCustomerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
}, { _id: false });

// Product schema for order items to store product details
const orderProductSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: false // Made optional for guest orders that might not have product IDs
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  // Store product details directly for order history
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },
  productImage: {
    type: String,
    default: ''
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  guestCustomer: guestCustomerSchema,

  products: [orderProductSchema],

  totalAmount: { 
    type: Number, 
    required: true 
  },

  deliveryOption: { 
    type: String, 
    enum: ['Standard', 'PickupMtaani', 'Express'], 
    required: true 
  },

  pickupLocationId: {
    type: String,
    default: null
  },

  status: { 
    type: String, 
    default: 'Pending',
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  },

  orderNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'bank', 'cash', 'paypal'],
    required: true
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Generate order number before saving if not provided
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp.slice(-6)}-${random}`;
  }
  next();
});

// Add index for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'guestCustomer.email': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

export default mongoose.model('Order', orderSchema);