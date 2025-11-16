import express from 'express';
import { 
  registerUser, 
  loginUser,
  sendGuestVerification,
  verifyGuest,
  sendAccountVerification, 
  verifyAccount
} from '../controllers/authController.js';

const router = express.Router();

// User registration and login
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-guest-verification', sendGuestVerification);
router.post('/verify-guest', verifyGuest);
router.post('/send-account-verification', sendAccountVerification);
router.post('/verify-account', verifyAccount);

export default router;