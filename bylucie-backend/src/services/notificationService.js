import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(accountSid, authToken);

export async function sendEmailOtp(email, otp) {
  try {
    const msg = {
      to: email,
      from: process.env.SENDER_EMAIL, // Verified sender email in SendGrid
      subject: 'Your OTP Code',
      text: `Your verification code is: ${otp}`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
    };

    await sgMail.send(msg);
    console.log(`Email OTP sent to ${email}`);
  } catch (error) {
    console.error('Failed to send email OTP:', error);
    throw error;
  }
}

export async function sendSmsOtp(phone, otp) {
  try {
    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${otp}`,
      from: fromPhone,
      to: phone,
    });
    console.log(`SMS OTP sent to ${phone}, Message SID: ${message.sid}`);
  } catch (error) {
    console.error('Failed to send SMS OTP:', error);
    throw error;
  }
}
