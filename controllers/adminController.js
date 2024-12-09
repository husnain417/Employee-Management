require('dotenv').config();
const User = require('../models/user');
const Admin = require('../models/admin');
const Category = require('../models/category');
const ExcelJS = require('exceljs');
const Order = require('../models/order');
const Vendor = require('../models/vendor');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendOtp } = require('../services/sendOtp');
const { reSendOtp } = require('../services/sendOtp');
const { notifyapprovalstatus } = require('../services/notifyapprovalstatus');

const approveVendor = async (req, res) => {
  try {
    const { vendorId, action } = req.body;
    const adminId = req.user.id;

    if (!vendorId || !adminId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: 'Invalid input.' });
    }

    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    const linkedUser = await User.findById(vendor.vendorId);
    if (!linkedUser) {
      return res.status(404).json({ message: 'Linked user not found.' });
    }

    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    if (action === "approve") {
      vendor.approvalStatus = "approved";
      await vendor.save();

      admin.vendorManagement.approvedVendors.push(vendor._id);
      await admin.save();

      await notifyapprovalstatus({
        username: linkedUser.username,
        email: linkedUser.email,
        action: "approve",
      });

      return res.status(200).json({
        message: 'Vendor approved successfully.',
      });
    } else if (action === "reject") {
      vendor.approvalStatus = "rejected";
      await vendor.save();

      linkedUser.isDeleted = true; 
      await linkedUser.save();

      admin.vendorManagement.rejectedVendors.push(vendor._id);
      await admin.save();

      await notifyapprovalstatus({
        username: linkedUser.username,
        email: linkedUser.email,
        action: "reject",
      });

      return res.status(200).json({
        message: 'Vendor rejected and removed from the system.',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

  const getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find();

  
      if (vendors.length === 0) {
        return res.status(404).json({ message: 'No vendors found.' });
      }
  
      res.status(200).json({
        message: 'Vendors retrieved successfully.',
        vendors,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  const getApprovedVendors = async (req, res) => {
    try {
      const approvedVendors = await Vendor.find({ approvalStatus: 'approved' });
  
      if (approvedVendors.length === 0) {
        return res.status(404).json({ message: 'No approved vendors found.' });
      }
  
      res.status(200).json({
        message: 'Approved vendors retrieved successfully.',
        vendors: approvedVendors,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  const getDisapprovedVendors = async (req, res) => {
    try {
      const disapprovedVendors = await Vendor.find({ approvalStatus: 'rejected' });
  
      if (disapprovedVendors.length === 0) {
        return res.status(404).json({ message: 'No disapproved vendors found.' });
      }
  
      res.status(200).json({
        message: 'Disapproved vendors retrieved successfully.',
        vendors: disapprovedVendors,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  const getPending = async (req, res) => {
    try {
      const pendingVendors = await Vendor.find({ approvalStatus: 'pending' });
  
      if (pendingVendors.length === 0) {
        return res.status(404).json({ message: 'No approval pending vendors found.' });
      }
  
      res.status(200).json({
        message: 'pending approval vendors retrieved successfully.',
        vendors: pendingVendors,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  const getVendorInfo = async (req, res) => {
    try {
      // Fetch all vendors and populate user details
      const vendors = await Vendor.find()
        .populate("vendorId", "name username email phone address profilePicUrl isVerified")
        .select("-__v -createdAt -updatedAt");
  
      if (!vendors || vendors.length === 0) {
        return res.status(404).json({ message: "No vendors found." });
      }
  
      const vendorInfo = vendors.map((vendor) => ({
        vendorId: vendor._id,
        approvalStatus: vendor.approvalStatus,
        contactDetails: vendor.vendorId?.profile?.phone,  // Fetching from user's profile
        address: vendor.vendorId?.profile?.address, // Fetching address from user's profile
        bankingInformation: vendor.vendorId?.profile?.bankingInformation, // Fetching from user's profile
        vendorUserInfo: {
          name: vendor.vendorId?.name,
          username: vendor.vendorId?.username,
          email: vendor.vendorId?.email,
          phone: vendor.vendorId?.phone,
          address: vendor.vendorId?.address,
          profilePicUrl: vendor.vendorId?.profilePicUrl,
          isVerified: vendor.vendorId?.isVerified,
        },
        products: vendor.products,
        inventory: vendor.inventory,
        orders: vendor.orders,
        salesInsights: vendor.salesInsights,
      }));
  
      res.status(200).json({
        message: "Vendors retrieved successfully.",
        vendors: vendorInfo,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  };

  const getVendorInfoById = async (req, res) => {
    try {
      const vendorId = req.params.id;
  
      const vendor = await Vendor.findById(vendorId)
        .populate("vendorId", "name username email phone address profilePicUrl isVerified")
        .select("-__v -createdAt -updatedAt");
  
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found." });
      }
  
      const vendorInfo = {
        vendorId: vendor._id,
        approvalStatus: vendor.approvalStatus,
        contactDetails: vendor.vendorId?.profile?.phone, 
        address: vendor.vendorId?.profile?.address, 
        bankingInformation: vendor.vendorId?.profile?.bankingInformation, 
        vendorUserInfo: {
          name: vendor.vendorId?.name,
          username: vendor.vendorId?.username,
          email: vendor.vendorId?.email,
          phone: vendor.vendorId?.phone,
          address: vendor.vendorId?.address,
          profilePicUrl: vendor.vendorId?.profilePicUrl,
          isVerified: vendor.vendorId?.isVerified,
        },
        products: vendor.products,
        inventory: vendor.inventory,
        orders: vendor.orders,
        salesInsights: vendor.salesInsights,
      };
  
      res.status(200).json({
        message: "Vendor retrieved successfully.",
        vendor: vendorInfo,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  };

  const getLowRatedVendors = async (req, res) => {
    try {
      const lowRatedVendors = await Product.aggregate([
        {
          $group: {
            _id: "$vendor",
            averageRating: { $avg: "$rating" },
          },
        },
        {
          $match: {
            averageRating: { $lt: 2 },
          },
        },
        {
          $lookup: {
            from: "vendors", // Name of the vendors collection
            localField: "_id",
            foreignField: "_id",
            as: "vendorDetails",
          },
        },
      ]);
  
      if (lowRatedVendors.length === 0) {
        return res.status(200).json({ message: "No vendors with average rating below 2." });
      }
  
      res.status(200).json({ lowRatedVendors });
    } catch (error) {
      console.error("Error fetching low-rated vendors:", error);
      res.status(500).json({ message: "An error occurred while fetching low-rated vendors." });
    }
  };
  
  const addCategory = async (req, res) => {
    try {
      const categories = Array.isArray(req.body.categories)
        ? req.body.categories // If an array is provided, use it directly
        : [req.body]; // If a single object is provided, wrap it in an array
  
      if (categories.length === 0) {
        return res.status(400).json({ message: "Please provide category data to add." });
      }
  
      const newCategories = [];
      for (const category of categories) {
        const { name, description } = category;
  
        // Validate that the name exists
        if (!name) {
          return res.status(400).json({ message: "Each category must have a name." });
        }
  
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
          continue; // Skip adding this category if it already exists
        }
  
        // Create a new category
        const newCategory = new Category({
          name,
          description: description || "",
          createdBy: req.user.id,
        });
  
        newCategories.push(newCategory);
      }
  
      // Save all new categories in one go
      if (newCategories.length > 0) {
        await Category.insertMany(newCategories);
        return res.status(201).json({
          message: `${newCategories.length} category(s) added successfully.`,
          categories: newCategories,
        });
      } else {
        return res.status(400).json({ message: "No new categories to add." });
      }
    } catch (error) {
      console.error("Error adding categories:", error);
      res.status(500).json({ message: "Server error while adding categories." });
    }
  };
  
  
  const deleteCategory = async (req, res) => {
    try {
      const { categoryId } = req.params;
  
      const deletedCategory = await Category.findByIdAndDelete(categoryId);
      if (!deletedCategory) {
        return res.status(404).json({ message: "Category not found." });
      }
  
      res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Server error while deleting category." });
    }
  };

  const getAllCategories = async (req, res) => {
    try {
      const categories = await Category.find().sort({ createdAt: -1 }); // Sort by newest
      res.status(200).json({ categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Server error while fetching categories." });
    }
  };
  
  const handleLowRatedVendor = async (req, res) => {
    const { vendorId } = req.params;
  
    try {
      // Find the vendor by ID
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found." });
      }
  
      // Find the linked user account and mark as isDeleted: true
      const linkedUser = await User.findById(vendor.userId); // Assuming `userId` is the link
      if (linkedUser) {
        linkedUser.isDeleted = true;
        await linkedUser.save();
      }
  
      await Vendor.findByIdAndDelete(vendorId);
  
      await notifyapprovalstatus({
        username: linkedUser?.username || "Vendor",
        email: linkedUser?.email,
        action: "removal",
      });
  
      // Return response
      res.status(200).json({ message: `Vendor ${vendor.name} removed successfully.` });
    } catch (error) {
      console.error("Error handling low-rated vendor:", error);
      res.status(500).json({ message: "An error occurred while removing the vendor." });
    }
  };
  

const getAdminSalesReport = async (req, res) => {
  try {
    const salesInsights = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorDetails',
        },
      },
      { $unwind: '$vendorDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails',
        },
      },
      { $unwind: '$customerDetails' },
      {
        $group: {
          _id: '$vendorDetails._id',
          vendorName: { $first: '$vendorDetails.vendorId' },
          approvalStatus: { $first: '$vendorDetails.approvalStatus' },
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          totalQuantitySold: { $sum: '$quantity' },
          uniqueCustomers: { $addToSet: '$customerDetails._id' },
          products: {
            $push: {
              productName: '$productDetails.name',
              category: '$productDetails.category',
              totalRevenue: '$totalAmount',
              totalQuantitySold: '$quantity',
            },
          },
        },
      },
      {
        $project: {
          vendorName: 1,
          approvalStatus: 1,
          totalRevenue: 1,
          totalOrders: 1,
          totalQuantitySold: 1,
          uniqueCustomers: { $size: '$uniqueCustomers' },
          products: 1,
        },
      },
      { $sort: { totalRevenue: -1 } }, // Sort by highest revenue
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Admin Sales Report');

    worksheet.columns = [
      { header: 'Vendor Name', key: 'vendorName', width: 30 },
      { header: 'Approval Status', key: 'approvalStatus', width: 20 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
      { header: 'Total Orders', key: 'totalOrders', width: 20 },
      { header: 'Quantity Sold', key: 'totalQuantitySold', width: 20 },
      { header: 'Unique Customers', key: 'uniqueCustomers', width: 20 },
      { header: 'Products', key: 'products', width: 50 },
    ];

    salesInsights.forEach((insight) => {
      worksheet.addRow({
        vendorName: insight.vendorName || 'Unknown',
        approvalStatus: insight.approvalStatus || 'N/A',
        totalRevenue: insight.totalRevenue.toFixed(2),
        totalOrders: insight.totalOrders,
        totalQuantitySold: insight.totalQuantitySold,
        uniqueCustomers: insight.uniqueCustomers,
        products: insight.products
          .map(
            (product) =>
              `${product.productName || 'Unknown'} - Revenue: ${
                product.totalRevenue.toFixed(2)
              }, Qty: ${product.totalQuantitySold}`
          )
          .join('; '),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=admin_sales_report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating admin sales report:', err);
    res.status(500).send('Server error while generating sales report.');
  }
};

module.exports = {
    approveVendor,
    getVendors,
    getApprovedVendors,
    getDisapprovedVendors,
    getPending,
    getVendorInfo,
    getVendorInfoById,
    addCategory,
    deleteCategory,
    getAllCategories,
    getLowRatedVendors,
    handleLowRatedVendor,
    getAdminSalesReport
  };
