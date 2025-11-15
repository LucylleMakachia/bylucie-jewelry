import mongoose from 'mongoose';

export function connectDB() {
  // Add a fallback MongoDB URI for development
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bylucie-jewelry';
  
  mongoose.connect(mongoURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process if DB connection fails
  });
}