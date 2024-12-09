const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendorManagement: {
      approvedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }],
      rejectedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }],
    },
    productOversight: {
      approvedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      rejectedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    },
    systemManagement: {
      websiteContent: { type: String, required: false }, 
      categories: [String],
      promotionalCampaigns: [{ title: String, description: String, startDate: Date, endDate: Date }],
    },
    orderManagement: {
      escalatedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    },
    reportingAndAnalytics: {
      salesReports: { type: [Object], default: [] }, // Placeholder for sales data
      vendorPerformance: { type: [Object], default: [] }, // Placeholder for vendor analytics
      userEngagementMetrics: { type: [Object], default: [] }, // Placeholder for user metrics
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
