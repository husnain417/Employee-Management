require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendCredentials = async ({username, email, password, emailToSendCred}) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailToSendCred,
        subject: 'Your Credentials',
        text: `Your credentials username: ${username} ,email: ${email}, password: ${password}`,
      };
  
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Error sending OTP:', err);
    }
  };

  module.exports = {sendCredentials,}