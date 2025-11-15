import express from 'express';
import { sendOtp, verifyOtp } from '../controllers/verificationController.js';

const router = express.Router();

router.post('/send-otp', sendOtp);        // Send OTP to email or phone
router.post('/verify-otp', verifyOtp);    // Verify the OTP entered by guest user

export default router;
