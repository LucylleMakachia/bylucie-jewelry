import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Proxy route for ipapi.co to avoid CORS issues
router.get('/ipapi', async (req, res) => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from ipapi:', error);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

export default router;