import nodemailer from 'nodemailer';

// Create SMTP transporter using your existing SMTP configuration
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

export async function sendEmail(to, subject, htmlContent) {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
      console.log(`📧 Development: Email would be sent to ${to}`);
      return { success: true, mode: 'development' };
    }

    const transporter = createTransporter();
    
    const msg = {
      from: process.env.SMTP_FROM_EMAIL || 'no-reply@bylucie.com',
      to: to,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(msg);
    console.log(`✅ Email sent to: ${to}`);
    return { success: true, mode: 'production' };
    
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message, mode: 'error' };
  }
}