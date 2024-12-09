const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateToken, authenticateResetToken } = require('../middleware/middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user')

const productStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const { productId } = req.body;

      if (!productId) {
        return cb(new Error("Product ID is required"));
      }

      const uploadPath = path.join(__dirname, "../productUploads", productId);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath); 
    } catch (err) {
      cb(err); 
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = `${file.originalname.split('.').slice(0, -1).join('.')}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});


const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and GIF file types are allowed"));
    }
    cb(null, true);
  },
}).array("images", 5);


  router.post('/addproduct', authenticateToken , vendorController.addProduct);
  router.delete('/deleteproduct/:productId', authenticateToken, vendorController.deleteProduct);
  router.post('/updateproduct/:productId', authenticateToken , vendorController.updateProduct);
  router.post(
    "/products/images",
    authenticateToken,
    uploadProductImages,
    vendorController.addProductImages
  );
  router.post("/inventory/restock", authenticateToken, vendorController.restockInventory);
  router.get("/inventory/:productId", authenticateToken, vendorController.getInventory); 
  router.post("/process-order", authenticateToken, vendorController.processOrder); 
  router.post("/update-order", authenticateToken, vendorController.updateOrderStatus); 
  router.get("/insights-get", authenticateToken, vendorController.getSalesInsightsExcel); 

module.exports = router;