const mongoose = require("mongoose");

const vendorPerformanceSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    ordersFulfilled: { type: Number, default: 0 },
    ordersReturned: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    complaints: { type: Number, default: 0 },
    lastEvaluated: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model("VendorPerformance", vendorPerformanceSchema);
  