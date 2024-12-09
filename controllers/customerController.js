require('dotenv').config();
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const Vendor = require('../models/vendor');
const Product = require('../models/product');
const PDFDocument = require('pdfkit');
const Order = require('../models/order');
const Category = require("../models/category");
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendOtp } = require('../services/sendOtp');
const { reSendOtp } = require('../services/sendOtp');
const { notifyapprovalstatus } = require('../services/notifyapprovalstatus');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const Inventory = require('../models/inventory');


const browseProductsByCategory = async (req, res) => {
    try {
      const { category } = req.params;
  
      const products = await Product.find({ category, isApproved: true }).populate('vendor', 'name').populate('category', 'name');
      if (!products || products.length === 0) {
        return res.status(404).json({ message: 'No products found in this category.' });
      }
  
      res.status(200).json({ products });
    } catch (error) {
      console.error('Error browsing products by category:', error);
      res.status(500).json({ message: 'Server error while fetching products.' });
    }
  };

  
  const filterProducts = async (req, res) => {
    try {
      const { priceRange, size, color, brand, rating } = req.body;
  
      const filters = {
        isApproved: true,
      };
  
      if (priceRange) filters.price = { $gte: priceRange.min, $lte: priceRange.max };
      if (size) filters.size = size; 
      if (color) filters.color = color; 
      if (brand) filters.brand = brand;
      if (rating) filters.rating = { $gte: rating };
  
      const products = await Product.find(filters).populate('category', 'name').populate('vendor', 'name');
  
      res.status(200).json({ products });
    } catch (error) {
      console.error('Error filtering products:', error);
      res.status(500).json({ message: 'Server error while filtering products.' });
    }
  };
  
  const addToCart = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const userId = req.user.id;
  
      let cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        cart = new Cart({ user: userId, products: [] });
      }
  
      const productExists = cart.products.find((item) => item.product.toString() === productId);
  
      if (productExists) {
        productExists.quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
  
      await cart.save();
  
      res.status(200).json({ message: 'Product added to cart successfully.', cart });
    } catch (error) {
      console.error('Error adding product to cart:', error);
      res.status(500).json({ message: 'Server error while adding to cart.' });
    }
  };

  const addToWishlist = async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.user.id;
  
      let wishlist = await Wishlist.findOne({ user: userId });
  
      // Create a new wishlist if it doesn't exist
      if (!wishlist) {
        wishlist = new Wishlist({ user: userId, products: [] });
      }
  
      // Check if the product is already in the wishlist
      const productExists = wishlist.products.some(
        (item) => item.product.toString() === productId
      );
      if (productExists) {
        return res.status(400).json({ message: 'Product already in wishlist.' });
      }
  
      // Add the product to the wishlist
      wishlist.products.push({ product: productId });
      await wishlist.save();
  
      res.status(200).json({ message: 'Product added to wishlist successfully.', wishlist });
    } catch (error) {
      console.error('Error adding product to wishlist:', error);
      res.status(500).json({ message: 'Server error while adding to wishlist.' });
    }
  };
  

  const viewProductDetails = async (req, res) => {
    try {
      const { productId } = req.params;
  
      const product = await Product.findById(productId)
      const inventory = await Inventory.findOne({product: productId})
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      res.status(200).json({ product,inventory });
    } catch (error) {
      console.error('Error fetching product details:', error);
      res.status(500).json({ message: 'Server error while fetching product details.' });
    }
  };
  

  
  const viewProductReviews = async (req, res) => {
    try {
      const { productId } = req.params;
  
      const product = await Product.findById(productId).select('rating');
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      res.status(200).json({ rating: product.rating });
    } catch (error) {
      console.error('Error fetching product rating:', error);
      res.status(500).json({ message: 'Server error while fetching product rating.' });
    }
  };
  

  const viewSizeGuide = async (req, res) => {
    try {
      
        const generalSizeGuide = {
            XS: { chest: '32-34 in', waist: '24-26 in', hips: '34-36 in' },
            S: { chest: '34-36 in', waist: '26-28 in', hips: '36-38 in' },
            M: { chest: '38-40 in', waist: '30-32 in', hips: '40-42 in' },
            L: { chest: '42-44 in', waist: '34-36 in', hips: '44-46 in' },
            XL: { chest: '46-48 in', waist: '38-40 in', hips: '48-50 in' },
          };  

      res.status(200).json({ sizeGuide: generalSizeGuide });
    } catch (error) {
      console.error('Error fetching size guide:', error);
      res.status(500).json({ message: 'Server error while fetching size guide.' });
    }
  };
  
  const viewCart = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const cart = await Cart.findOne({ user: userId })
        .populate('products.product', 'name price image')
        .exec();
  
      if (!cart || cart.products.length === 0) {
        return res.status(404).json({ message: 'Cart is empty.' });
      }
  
      res.status(200).json({ cart });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: 'Server error while fetching cart.' });
    }
  };
  
  const placeOrder = async (req, res) => {
    try {
      const { paymentMethod, shippingDetails } = req.body;
      const customerId = req.user.id;
  
      const cart = await Cart.findOne({ user: customerId }).populate('products.product');
      if (!cart || cart.products.length === 0) {
        return res.status(400).json({ message: 'Cart is empty. Add items to the cart before placing an order.' });
      }
  
      // Array to store created orders
      const createdOrders = [];
  
      // Step 2: Loop through the cart and create an order for each product
      for (const item of cart.products) {
        const product = item.product;
  
        // Check if the product exists
        if (!product) {
          return res.status(400).json({ message: `Product not found.` });
        }
  
        // Step 2.1: Check inventory for the product's stock
        const inventory = await Inventory.findOne({ product: product._id });
  
        if (!inventory) {
          return res.status(400).json({ message: `Inventory record not found for ${product.name}.` });
        }
  
        // Compare the stock in inventory with the quantity in the cart
        if (inventory.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}. Only ${inventory.stock} items available.` });
        }
  
        // Calculate total amount for this specific product
        const totalAmount = product.price * item.quantity;
  
        // Step 3: Deduct the stock for the product in the inventory
        inventory.stock -= item.quantity;
        await inventory.save();
  
        // Step 4: Create an order for this specific product
        const order = new Order({
          product: product._id,
          vendor: product.vendor,
          customer: customerId,
          quantity: item.quantity,
          totalAmount,
          paymentMethod,
          shippingDetails,
        });
  
        // Save the order
        await order.save();
        createdOrders.push(order);
      }
  
      // Clear the cart after successful order placement
      cart.products = [];
      await cart.save();
  
      // Return success response with all created orders
      res.status(201).json({ 
        message: 'Orders placed successfully', 
        orders: createdOrders 
      });
  
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({ message: 'Server error while placing the order' });
    }
  };

  const trackOrders = async (req, res) => {
    try {
      const customerId = req.user.id;
      const orders = await Order.find({ customer: customerId }).populate('products.product', 'name price');
  
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: 'No orders found' });
      }
  
      res.status(200).json({ orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Server error while fetching orders' });
    }
  };

  const requestReturnOrExchange = async (req, res) => {
    try {
      const { orderId, action } = req.body; // action: 'Return' or 'Exchange'
      const customerId = req.user.id;
  
      const order = await Order.findOne({ _id: orderId, customer: customerId });
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      if (order.status === 'Delivered') {
        order.status = action === 'Return' ? 'Returned' : 'Exchange Requested';
        await order.save();
  
        return res.status(200).json({ message: `Order ${action.toLowerCase()} requested successfully`, order });
      }
  
      res.status(400).json({ message: `Order cannot be ${action.toLowerCase()} at this stage` });
    } catch (error) {
      console.error('Error requesting return/exchange:', error);
      res.status(500).json({ message: 'Server error while requesting return/exchange' });
    }
  };

  const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.id;

        const order = await Order.findOne({ _id: orderId, customer: customerId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Fetch the product separately if needed
        const product = await Product.findById(order.product);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const pdfDoc = new PDFDocument();
        const fileName = `Invoice_${orderId}.pdf`;
        const invoicePath = path.join(__dirname, '../invoices', fileName);

        // Generate PDF
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.text(`Invoice for Order ID: ${orderId}`);
        pdfDoc.text(`Customer: ${req.user.username}`);
        pdfDoc.text(`Total Amount: ${order.totalAmount}`);
        pdfDoc.text(`Shipping Details: ${order.shippingDetails.address}, ${order.shippingDetails.city}`);
        
        // Use the separately fetched product
        pdfDoc.text(`${product.name} - ${order.quantity} x ${product.price}`);
        
        pdfDoc.end();

        // Save invoice URL
        order.invoiceUrl = `${req.protocol}://${req.get('host')}/invoices/${fileName}`;
        await order.save();

        // Send file
        res.download(invoicePath);
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ message: 'Server error while downloading invoice' });
    }
};

  const getPersonalizedRecommendations = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const wishlist = await Wishlist.findOne({ user: userId }).populate('products', 'category');
      const orders = await Order.find({ customer: userId }).populate('products.product', 'category');
  
      const categoryCounts = {};
  
      if (wishlist) {
        wishlist.products.forEach((product) => {
          const category = product.category.toString();
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
  
      orders.forEach((order) => {
        order.products.forEach((item) => {
          const category = item.product.category.toString();
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      });
  
      const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .map(([category]) => category);
  
      const recommendedProducts = await Product.find({
        category: { $in: sortedCategories },
        isApproved: true,
        _id: { $nin: wishlist ? wishlist.products.map((p) => p._id) : [] }, // Exclude wishlist products
      })
        .limit(10) // Limit recommendations
        .populate('category', 'name');
  
      res.status(200).json({ recommendations: recommendedProducts });
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      res.status(500).json({ message: 'Server error while fetching recommendations.' });
    }
  };
  
  
  module.exports = {
    browseProductsByCategory,
    filterProducts,
    addToCart,
    addToWishlist,
    viewProductDetails,
    viewProductReviews,
    viewSizeGuide,
    viewCart,
    placeOrder,
    trackOrders,
    requestReturnOrExchange,
    downloadInvoice,
    getPersonalizedRecommendations,
  };
  