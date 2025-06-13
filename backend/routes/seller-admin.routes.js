const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sellerAdminController = require('../controllers/seller-admin.controller');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Seller Management Routes
router.get('/sellers', auth, adminAuth, sellerAdminController.getAllSellers);
router.put('/sellers/:sellerId/status', auth, adminAuth, sellerAdminController.updateSellerStatus);
router.delete('/sellers/:sellerId', auth, adminAuth, sellerAdminController.deleteSeller);
router.put('/sellers/:sellerId', auth, adminAuth, sellerAdminController.updateSeller);
router.get('/sellers/:sellerId', auth, adminAuth, sellerAdminController.getSellerDetails);

// Product Management Routes
router.get('/products', auth, adminAuth, sellerAdminController.getAllProducts);
router.put('/products/:productId/status', auth, adminAuth, sellerAdminController.updateProductStatus);
router.delete('/products/:productId', auth, adminAuth, sellerAdminController.deleteProduct);
router.get('/products/:productId', auth, adminAuth, sellerAdminController.getProductDetails);

// Order Management Routes
router.get('/orders', auth, adminAuth, sellerAdminController.getAllOrders);
router.put('/orders/:orderId/status', auth, adminAuth, sellerAdminController.updateOrderStatus);
router.get('/orders/:orderId', auth, adminAuth, sellerAdminController.getOrderDetails);

module.exports = router; 