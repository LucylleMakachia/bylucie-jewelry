import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import africastalking from 'africastalking';

// Initialize Africa's Talking
const atClient = africastalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});

const sms = atClient.SMS;

// Generate random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification codes temporarily
const verificationCodes = new Map();

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

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

    if (method === 'email' && email) {
      const verificationCode = generateVerificationCode();
      
      verificationCodes.set(email, {
        code: verificationCode,
        expires: Date.now() + 10 * 60 * 1000
      });

      if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
        return res.json({
          success: true,
          message: 'Verification code generated',
          method: 'email',
          destination: email,
          debugCode: verificationCode
        });
      }

      try {
        const transporter = createTransporter();
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL,
          to: email,
          subject: 'Your Verification Code - MyStore',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #b8860b; margin: 0;">Email Verification</h2>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="margin-bottom: 15px; font-size: 16px; color: #333;">Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #b8860b; letter-spacing: 8px; margin: 20px 0;">
                  ${verificationCode}
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">Enter this code in the verification form to complete your order.</p>
              </div>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                  If you didn't request this code, please ignore this email.
                </p>
              </div>
            </div>
          `,
        });

        return res.json({
          success: true,
          message: 'Verification code sent to email',
          method: 'email',
          destination: email
        });

      } catch (emailError) {
        return res.json({
          success: true,
          message: 'Verification code generated',
          method: 'email',
          destination: email,
          debugCode: verificationCode
        });
      }
      
    } else if (method === 'phone' && phone) {
      const verificationCode = generateVerificationCode();
      
      verificationCodes.set(phone, {
        code: verificationCode,
        expires: Date.now() + 10 * 60 * 1000
      });

      if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
        return res.json({
          success: true,
          message: 'SMS code generated',
          method: 'phone', 
          destination: phone,
          debugCode: verificationCode
        });
      }

      try {
        await sms.send({
          to: phone,
          message: `Your verification code is: ${verificationCode}. This code expires in 10 minutes. - ByLucie`,
          from: process.env.AT_SENDER_ID || 'ByLucie'
        });

        return res.json({
          success: true,
          message: 'Verification code sent to phone',
          method: 'phone', 
          destination: phone
        });

      } catch (smsError) {
        return res.json({
          success: true,
          message: 'SMS code generated',
          method: 'phone', 
          destination: phone,
          debugCode: verificationCode
        });
      }
      
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification method or missing contact info'
      });
    }
    
  } catch (error) {
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

    if (method === 'email' && email) {
      const storedData = verificationCodes.get(email);
      
      if (!storedData) {
        return res.status(400).json({
          success: false,
          error: 'No verification code found. Please request a new one.'
        });
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(email);
        return res.status(400).json({
          success: false,
          error: 'Verification code has expired. Please request a new one.'
        });
      }

      if (storedData.code === code) {
        verificationCodes.delete(email);
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
    } else if (method === 'phone' && phone) {
      const storedData = verificationCodes.get(phone);
      
      if (!storedData) {
        return res.status(400).json({
          success: false,
          error: 'No verification code found. Please request a new one.'
        });
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(phone);
        return res.status(400).json({
          success: false,
          error: 'Verification code has expired. Please request a new one.'
        });
      }

      if (storedData.code === code) {
        verificationCodes.delete(phone);
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
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification method'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
};

export const sendAccountVerification = async (req, res) => {
  try {
    const { method, email } = req.body;

    if (method === 'email' && email) {
      const verificationCode = generateVerificationCode();
      
      verificationCodes.set(email, {
        code: verificationCode,
        expires: Date.now() + 10 * 60 * 1000
      });

      if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
        return res.json({
          success: true,
          message: 'Verification code generated',
          method: 'email',
          debugCode: verificationCode
        });
      }

      try {
        const transporter = createTransporter();
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL,
          to: email,
          subject: 'Your Account Verification Code - MyStore',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #b8860b; text-align: center;">Account Verification</h2>
              <p>Your verification code is: <strong style="font-size: 24px;">${verificationCode}</strong></p>
              <p>This code will expire in 10 minutes.</p>
            </div>
          `,
        });

        return res.json({
          success: true,
          message: `Verification code sent to your ${method}`,
          method
        });

      } catch (emailError) {
        return res.json({
          success: true,
          message: 'Verification code generated',
          method: 'email',
          debugCode: verificationCode
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification method'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { code, method, email } = req.body;

    if (method === 'email' && email) {
      const storedData = verificationCodes.get(email);
      
      if (!storedData) {
        return res.status(400).json({
          success: false,
          error: 'No verification code found. Please request a new one.'
        });
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(email);
        return res.status(400).json({
          success: false,
          error: 'Verification code has expired. Please request a new one.'
        });
      }

      if (storedData.code === code) {
        verificationCodes.delete(email);
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
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification method'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
};