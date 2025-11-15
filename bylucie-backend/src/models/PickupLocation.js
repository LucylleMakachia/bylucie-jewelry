import mongoose from 'mongoose';

const pickupLocationSchema = new mongoose.Schema({
  name: String,
  address: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  contactNumber: String,
});

export default mongoose.model('PickupLocation', pickupLocationSchema);
