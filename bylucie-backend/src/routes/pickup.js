import express from 'express';
import { getPickupLocations } from '../controllers/pickupController.js';

const router = express.Router();

router.get('/', getPickupLocations);

export default router;
