import express from 'express';
import {
  createPickupLocation,
  getPickupLocations,
  getPickupLocationById,
  updatePickupLocation,
  deletePickupLocation,
} from '../../controllers/admin/pickupLocationsController.js';
import { authenticateClerk, attachClerkUser, requireAdmin } from '../../middleware/clerkAuth.js';

const router = express.Router();

router.use(authenticateClerk, attachClerkUser, requireAdmin);;

router.post('/', createPickupLocation);
router.get('/', getPickupLocations);
router.get('/:id', getPickupLocationById);
router.put('/:id', updatePickupLocation);
router.delete('/:id', deletePickupLocation);

export default router;
