import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1'; 

mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`)); // ← Add HOST here
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});