const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", 
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", 
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      required: true,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          altText: { type: String, required: true },
        },
      ],
      validate: {
        validator: function (val) {
          return val.length <= 5;
        },
        message: "A product can have a maximum of 5 images.",
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
