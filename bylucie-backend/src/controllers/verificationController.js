import crypto from 'crypto';
import otpStore from '../services/otpStore.js'; // Temporary in-memory store or Redis
import { sendEmailOtp, sendSmsOtp } from '../services/notificationService.js';

export async function sendOtp(req, res) {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  const otp = (Math.floor(Math.random() * 900000) + 100000).toString(); // 6-digit OTP
  const otpToken = crypto.randomBytes(20).toString('hex');

  // Save OTP with token and expire in 5 minutes
  otpStore.set(otpToken, { otp, email, phone, createdAt: Date.now() });

  // Send OTP via email or SMS
  try {
    if (email) await sendEmailOtp(email, otp);
    else if (phone) await sendSmsOtp(phone, otp);

    res.json({ otpToken, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

export async function verifyOtp(req, res) {
  const { otpToken, otp } = req.body;
  if (!otpToken || !otp) {
    return res.status(400).json({ error: 'OTP token and OTP code are required' });
  }

  const data = otpStore.get(otpToken);
  if (!data) return res.status(400).json({ error: 'Invalid or expired OTP token' });

  if (data.otp !== otp) return res.status(400).json({ error: 'Invalid OTP code' });

  // OTP valid, remove to prevent reuse
  otpStore.delete(otpToken);

  // Return success and relevant verified data (email or phone)
  res.json({ message: 'OTP verified', verifiedEmail: data.email, verifiedPhone: data.phone });
}
