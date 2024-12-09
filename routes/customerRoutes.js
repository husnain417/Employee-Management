const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, authenticateResetToken,isAdmin } = require('../middleware/middleware');

// Product browsing and filtering
router.get('/products/category/:category', customerController.browseProductsByCategory);
router.post('/products/filter', customerController.filterProducts);

// Product details and reviews
router.get('/products/:productId', customerController.viewProductDetails);
router.get('/products/:productId/reviews', customerController.viewProductReviews);

// Size guide
router.get('/size-guide', customerController.viewSizeGuide);

// Cart management
router.post('/cart', authenticateToken, customerController.addToCart);
router.get('/cart', authenticateToken, customerController.viewCart);

// Wishlist management
router.post('/wishlist', authenticateToken, customerController.addToWishlist);

// Order management
router.post('/orders', authenticateToken, customerController.placeOrder);
router.get('/orders', authenticateToken, customerController.trackOrders);
router.post('/orders/return-or-exchange', authenticateToken, customerController.requestReturnOrExchange);

// Invoice
router.get('/orders/:orderId/invoice', authenticateToken, customerController.downloadInvoice);

//recommendation
router.get('/recommendations', authenticateToken, customerController.getPersonalizedRecommendations);


module.exports = router;
