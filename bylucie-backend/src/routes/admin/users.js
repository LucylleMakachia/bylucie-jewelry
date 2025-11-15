import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../../controllers/admin/usersController.js';
import { authenticateClerk, attachClerkUser, requireAdmin } from '../../middleware/clerkAuth.js';  

const router = express.Router();

// imported functions
router.use(authenticateClerk, attachClerkUser, requireAdmin);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;