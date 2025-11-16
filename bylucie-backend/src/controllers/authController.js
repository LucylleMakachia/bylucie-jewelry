import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function registerUser(req, res) {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Send verification code for guest users
export const sendGuestVerification = async (req, res) => {
  try {
    const { method, email, phone } = req.body;
    
    console.log(`🔐 Guest verification requested:`, { method, email, phone });

    if (method === 'email' && email) {
      // TODO: Implement actual email service
      console.log(`📧 Sending email verification to: ${email}`);
      
      return res.json({
        success: true,
        message: 'Verification code sent to email',
        method: 'email',
        destination: email
      });
      
    } else if (method === 'phone' && phone) {
      // TODO: Implement actual SMS service
      console.log(`📱 Sending SMS verification to: ${phone}`);
      
      return res.json({
        success: true,
        message: 'Verification code sent to phone',
        method: 'phone', 
        destination: phone
      });
      
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification method or missing contact info'
      });
    }
    
  } catch (error) {
    console.error('❌ Guest verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
};

// Verify guest user code
export const verifyGuest = async (req, res) => {
  try {
    const { code, method, email, phone } = req.body;
    
    console.log(`🔐 Guest verification attempt:`, { method, code });

    // TODO: Implement actual code validation
    if (code && code.length === 6 && /^\d+$/.test(code)) {
      return res.json({
        success: true,
        message: 'Identity verified successfully',
        method,
        verified: true
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
  } catch (error) {
    console.error('❌ Guest verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
};

// Send verification for authenticated users
export const sendAccountVerification = async (req, res) => {
  try {
    const { method } = req.body;
    
    console.log(`🔐 Account verification requested:`, { method });

    return res.json({
      success: true,
      message: `Verification code sent to your ${method}`,
      method
    });
    
  } catch (error) {
    console.error('❌ Account verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
};

// Verify authenticated user code
export const verifyAccount = async (req, res) => {
  try {
    const { code, method } = req.body;
    
    console.log(`🔐 Account verification attempt:`, { method, code });

    // TODO: Implement actual code validation
    if (code && code.length === 6 && /^\d+$/.test(code)) {
      return res.json({
        success: true,
        message: 'Account verified successfully',
        method,
        verified: true
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
  } catch (error) {
    console.error('❌ Account verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
};