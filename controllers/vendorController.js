require('dotenv').config();
const User = require('../models/user');
const Vendor = require('../models/vendor');
const Product = require('../models/product');
const Category = require("../models/category");
const ExcelJS = require('exceljs');
const Order = require("../models/order");
const Inventory = require("../models/inventory");
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendOtp } = require('../services/sendOtp');
const { reSendOtp } = require('../services/sendOtp');
const { notifyapprovalstatus } = require('../services/notifyapprovalstatus');
const { orderUpdate } = require("../services/orderupdate");

const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const vendorId = req.user.id; 

    const categoryExists = await Category.findOne({name: category});
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found." });
    }

    const product = new Product({
      name,
      description,
      price,
      category: categoryExists._id,
      vendor: vendorId,
    });

    const savedProduct = await product.save();

    const inventory = new Inventory({
      product: savedProduct._id,
      stock,
      restocked: [{ date: new Date(), quantity: stock }],
      lastRestocked: new Date(),
    });

    await inventory.save();

    res.status(201).json({ 
      message: "Product and inventory added successfully.", 
      product: savedProduct, 
      inventory 
    });
  } catch (error) {
    console.error("Error adding product and inventory:", error);
    res.status(500).json({ message: "Server error while adding product and inventory." });
  }
};


  const updateProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      const { name, description, price, category, stock } = req.body;
      const vendorId = req.user.id; 
  
      const product = await Product.findOne({ _id: productId, vendor: vendorId });
      if (!product) {
        return res.status(404).json({ message: "Product not found or unauthorized." });
      }
  
      if (name) product.name = name;
      if (description) product.description = description;
      if (price) product.price = price;
      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(404).json({ message: "Category not found." });
        }
        product.category = category;
      }
      if (stock !== undefined) product.stock = stock;
  
      if (req.files?.length > 0) {
        product.images = req.files.map((file) => ({
          url: file.path,
          altText: `${name || product.name} image`,
        }));
      }
  
      await product.save();
      res.status(200).json({ message: "Product updated successfully.", product });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Server error while updating product." });
    }
  };

  const deleteProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      const vendorId = req.user.id;
  
      const product = await Product.findOneAndDelete({ _id: productId, vendor: vendorId });
      if (!product) {
        return res.status(404).json({ message: "Product not found or unauthorized." });
      }
  
      res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Server error while deleting product." });
    }
  };
  
  
  const addProductImages = async (req, res) => {
    try {
      const { productId } = req.body;
  
      // Find the product by its ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }
  
      // Generate image URLs and validate against max limit
      const newImages = req.files.map((file) => ({
        url: `${req.protocol}://${req.get("host")}/productUploads/${productId.replace(/[^a-zA-Z0-9_-]/g, "_")}/${file.filename}`,
        altText: `${product.name} image`,
      }));
  
      if (product.images.length + newImages.length > 5) {
        return res.status(400).json({
          message: `Cannot add images. Maximum limit of 5 images exceeded. Current count: ${product.images.length}.`,
        });
      }
  
      // Add new images to the product
      product.images.push(...newImages);
      await product.save();
  
      res.status(200).json({ message: "Images added successfully.", images: product.images });
    } catch (error) {
      console.error("Error adding images:", error);
      res.status(500).json({ message: "Server error while adding images." });
    }
  };
  
  

  const restockInventory = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
  
      const inventory = await Inventory.findOne({ product: productId });
      if (!inventory) {
        return res.status(404).json({ message: "Inventory record not found for this product." });
      }
  
      inventory.stock += quantity;
      inventory.restocked.push({ date: new Date(), quantity });
      inventory.lastRestocked = new Date();
  
      await inventory.save();
  
      res.status(200).json({ message: "Inventory restocked successfully.", inventory });
    } catch (error) {
      console.error("Error restocking inventory:", error);
      res.status(500).json({ message: "Server error while restocking inventory." });
    }
  };
  
  const getInventory = async (req, res) => {
    try {
      const { productId } = req.params;
  
      const inventory = await Inventory.findOne({ product: productId }).populate("product");
      if (!inventory) {
        return res.status(404).json({ message: "Inventory record not found." });
      }
  
      res.status(200).json({ inventory });
    } catch (error) {
      console.error("Error retrieving inventory:", error);
      res.status(500).json({ message: "Server error while retrieving inventory." });
    }
  };

  const processOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const vendorId = req.user.id;

        // Find the existing order
        const order = await Order.findById(orderId).populate('product customer');
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Verify the vendor matches the product's vendor
        if (order.product.vendor.toString() !== vendorId) {
            return res.status(403).json({ message: "Unauthorized to process this order." });
        }

        order.status = "Shipped";
        order.dispatchedAt = new Date();
        await order.save();

        // Notify customer about order update
        await orderUpdate({
            username: order.customer.name,
            email: order.customer.email,
            status: "Shipped",
            orderId: order._id,
        });

        res.status(200).json({ 
            message: "Order processed successfully.", 
            order 
        });

    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Server error while processing the order." });
    }
};

  const updateOrderStatus = async (req, res) => {
    try {
      const { orderId, status } = req.body;
  
      const validStatuses = ["Shipped", "In Transit", "Delivered", "Cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid order status." });
      }
  
      const order = await Order.findById(orderId).populate("customer");
      if (!order) {
        return res.status(404).json({ message: "Order not found." });
      }
  
      if (order.vendor.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "You are not authorized to update this order." });
      }
  
      order.status = status;
  
      if (status === "Shipped") order.dispatchedAt = new Date();
      if (status === "Delivered") order.deliveredAt = new Date();
  
      await order.save();
  
      // Notify customer about order status update
      await orderUpdate({
        username: order.customer.name,
        email: order.customer.email,
        status: order.status,
        orderId: order._id,
      });
  
      res.status(200).json({ message: "Order status updated successfully.", order });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Server error while updating order status." });
    }
  };

  const getSalesInsightsExcel = async (req, res) => {
    try {
      const vendorId = req.user.id; 
      
      const salesInsights = await Order.aggregate([
        { $match: { vendor: vendorId, status: 'Delivered' } }, 
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
          $group: {
            _id: '$productDetails._id',
            productName: { $first: '$productDetails.name' },
            category: { $first: '$productDetails.category' },
            totalRevenue: { $sum: '$totalAmount' },
            totalQuantitySold: { $sum: '$quantity' },
            totalOrders: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } }, 
      ]);
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Insights');
  
      worksheet.columns = [
        { header: 'Product Name', key: 'productName', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
        { header: 'Quantity Sold', key: 'totalQuantitySold', width: 20 },
        { header: 'Total Orders', key: 'totalOrders', width: 20 },
      ];
  
      salesInsights.forEach((insight) => {
        worksheet.addRow({
          productName: insight.productName || 'Unknown',
          category: insight.category || 'Uncategorized',
          totalRevenue: insight.totalRevenue.toFixed(2),
          totalQuantitySold: insight.totalQuantitySold,
          totalOrders: insight.totalOrders,
        });
      });
  
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=sales_insights.xlsx'
      );
  
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('Error generating sales insights Excel file:', err);
      res.status(500).send('Server error while generating sales insights.');
    }
  };
  
  
module.exports = {
    addProduct,
    updateProduct,
    deleteProduct,
    addProductImages,
    restockInventory,
    getInventory,
    processOrder,
    updateOrderStatus,
    getSalesInsightsExcel,
};
