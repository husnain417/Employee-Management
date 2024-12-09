const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authenticateResetToken,isAdmin } = require('../middleware/middleware');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const User = require('../models/user');

router.post('/vendor-approve',authenticateToken ,isAdmin, adminController.approveVendor);
router.get('/vendors',authenticateToken ,isAdmin, adminController.getVendors);
router.get('/vendors/approved',authenticateToken,isAdmin,adminController.getApprovedVendors);
router.get('/vendors/rejected',authenticateToken ,isAdmin, adminController.getDisapprovedVendors);
router.get('/vendors/pending',authenticateToken ,isAdmin, adminController.getPending);
router.get('/vendorsinfo',authenticateToken ,isAdmin, adminController.getVendorInfo);
router.get('/vendorsinfo/:id', authenticateToken, isAdmin, adminController.getVendorInfoById);
router.post("/categories", authenticateToken, isAdmin, adminController.addCategory);
router.delete("/categories/:categoryId", authenticateToken, isAdmin, adminController.deleteCategory);
router.get("/categories", adminController.getAllCategories);
router.get("/vendors/low-rated", authenticateToken, isAdmin, adminController.getLowRatedVendors);
router.delete("/vendors/remove/:vendorId", authenticateToken, isAdmin, adminController.handleLowRatedVendor);
router.get("/insights", authenticateToken, isAdmin, adminController.getAdminSalesReport);

module.exports = router;
