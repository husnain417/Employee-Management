const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    inventory: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        stock: { type: Number, required: true },
      },
    ],
    orders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        status: {
          type: String,
          enum: ["shipped", "in transit", "delivered", "returned"],
          required: true,
        },
        shippingDetails: {
          trackingNumber: String,
          carrier: String,
          dispatchDate: Date,
        },
      },
    ],
    salesInsights: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        totalSales: Number,
        revenue: Number,
      },
    ],
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
