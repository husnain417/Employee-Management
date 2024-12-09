const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "vendor", "customer"],
    },
    profile: {
      phone: { type: String, required: false },
      address: [
        {
          fullName: String,
          street: String,
          city: String,
          state: String,
          zipCode: String,
          country: String,
        },
      ],
      bankingInformation: {
        accountNumber: { type: String },
        bankName: { type: String },
      },
    },
    otp: { type: String, required: false },
    otpExpires: { type: Date, required: false },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    emailToSendCred: { type: String, required: false },
    profilePicUrl: {
      type: String,
      required: false
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
