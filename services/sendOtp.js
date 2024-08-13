require('dotenv').config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtp = async (user) => {
  try {
    const otp = crypto.randomInt(100000, 999999).toString();
    const time = 2;  // Time in minutes
    user.otp = otp;
    user.otpExpires = Date.now() + time * 60 * 1000;  
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It will expire in ${time} minute${time > 1 ? 's' : ''}.`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending OTP:', err);
  }
};

const reSendOtp = async (user) => {
  try {
    const otp = crypto.randomInt(100000, 999999).toString();
    const time = 5;  // Time in minutes
    user.otp = otp;
    user.otpExpires = Date.now() + time * 60 * 1000;  
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your OTP Code',
      text: `Your new OTP code is ${otp}. It will expire in ${time} minute${time > 1 ? 's' : ''}.`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending OTP:', err);
  }
};

module.exports = { sendOtp,reSendOtp };
