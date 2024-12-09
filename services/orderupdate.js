require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Notify customer about order updates.
 * @param {Object} param0 - Notification details.
 * @param {string} param0.username - Customer's name.
 * @param {string} param0.email - Customer's email.
 * @param {string} param0.status - Current order status.
 * @param {string} param0.orderId - Order ID.
 */
const orderUpdate = async ({ username, email, status, orderId }) => {
  try {
    const subject = `Order Update: Your order is now ${status}`;
    const message = `Hello ${username},\n\nYour order (ID: ${orderId}) status has been updated to: ${status}.\n\nThank you for shopping with Infinite Clothing!\n\nRegards, Infinite Clothing Team.`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order update email sent to ${email}`);
  } catch (err) {
    console.error('Error sending order update email:', err);
  }
};

module.exports = { orderUpdate };
