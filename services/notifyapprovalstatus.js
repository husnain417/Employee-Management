require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const notifyapprovalstatus = async ({ username, email, action }) => {
  try {
    let subject, message;

    if (action === "approve") {
      subject = "Vendor Application Approved";
      message = `Hello ${username},\n\nYour vendor account has been approved. You can now start adding products.\n\nRegards, Infinite Clothing Team.`;
    } else if (action === "reject") {
      subject = "Vendor Application Rejected";
      message = `Hello ${username},\n\nWe regret to inform you that your vendor application has been rejected.\n\nRegards, Infinite Clothing Team.`;
    } else if (action === "removal") {
      subject = "Vendor Account Removed";
      message = `Hello ${username},\n\nWe regret to inform you that your vendor account has been removed due to poor performance and low product ratings. Please contact us if you have any concerns.\n\nRegards, Infinite Clothing Team.`;
    } else {
      throw new Error("Invalid action provided.");
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

module.exports = { notifyapprovalstatus };
