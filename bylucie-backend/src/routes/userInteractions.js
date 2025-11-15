import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// POST /api/interactions - log user/admin events
router.post('/interactions', async (req, res) => {
  try {
    const { userId, eventType, metadata } = req.body;
    if (!userId || !eventType) {
      return res.status(400).json({ error: 'Missing required fields: userId, eventType' });
    }
    const interaction = {
      userId,
      eventType,
      metadata: metadata || {},
      timestamp: new Date(),
    };
    await mongoose.connection.db.collection('userInteractions').insertOne(interaction);
    res.json({ success: true, message: 'Interaction logged successfully' });
  } catch (error) {
    console.error('Error saving user interaction:', error.stack || error.message);
    res.status(500).json({ error: 'Failed to save interaction' });
  }
});

export default router;
