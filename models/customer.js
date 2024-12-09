const mongoose = require("mongoose");


const customerSchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      cart: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          quantity: { type: Number, required: true },
        },
      ],
      wishlist: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        },
      ],
      orders: [
        {
          orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
          status: {
            type: String,
            enum: ["placed", "processed", "shipped", "delivered", "returned"],
            required: true,
          },
        },
      ],
      browsingHistory: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      recommendations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      customerSupport: {
        tickets: [
          {
            ticketId: { type: mongoose.Schema.Types.ObjectId },
            issue: String,
            status: { type: String, enum: ["open", "resolved", "closed"], required: true },
          },
        ],
      },
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("customer", customerSchema);
  